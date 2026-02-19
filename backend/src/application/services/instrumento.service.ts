
import { prisma } from '../../infra/database/prisma.client'
import { InstrumentoRepository } from '../../infra/repositories/instrumento.repository'
import { parse } from 'csv-parse'
import { Readable } from 'stream'

export class InstrumentoService {
    private repository: InstrumentoRepository

    constructor() {
        this.repository = new InstrumentoRepository()
    }

    private normalize(nome: string) {
        return nome.trim().toUpperCase().replace(/\s+/g, ' ')
    }

    async create(data: { nome: string }, tenantId: string) {
        const nome = this.normalize(data.nome)

        // 1. Check logical existence
        const existing = await this.repository.findByNameIncludingDeleted(nome, tenantId)
        if (existing) {
            if (existing.deletedAt) {
                return this.repository.restore(existing.id)
            }
            return existing
        }

        // 2. Optimistic Create
        try {
            return await this.repository.create({ nome }, tenantId)
        } catch (e: any) {
            // 3. Handle Race Condition
            if (e.code === 'P2002') {
                const retry = await this.repository.findByNameIncludingDeleted(nome, tenantId)
                if (retry) {
                    if (retry.deletedAt) return this.repository.restore(retry.id)
                    return retry
                }
            }
            throw e
        }
    }

    async findOrCreateByName(nome: string, tenantId: string) {
        return this.create({ nome }, tenantId)
    }

    async update(id: string, data: { nome: string }, tenantId: string) {
        const nome = this.normalize(data.nome)

        const existing = await this.repository.findByNameIncludingDeleted(nome, tenantId)
        if (existing && existing.id !== id) {
            throw new Error('Instrumento with this name already exists')
        }

        return this.repository.update(id, { nome }, tenantId)
    }

    async list(tenantId: string) {
        return this.repository.list(tenantId)
    }

    async delete(id: string, tenantId: string) {
        return this.repository.softDelete(id, tenantId)
    }

    async findById(id: string, tenantId: string) {
        return this.repository.findById(id, tenantId)
    }

    async importCsv(fileBuffer: Buffer, tenantId: string) {
        const records: any[] = []
        const parser = parse(fileBuffer, {
            delimiter: [',', ';'],
            columns: false,
            skip_empty_lines: true,
            trim: true
        })

        for await (const record of parser) {
            records.push(record)
        }

        let inseridos = 0
        let ignorados = 0

        await prisma.$transaction(async (tx) => {
            for (const record of records) {
                const rawName = Array.isArray(record) ? record[0] : record.nome
                if (!rawName || rawName.length < 2) continue

                const nome = this.normalize(rawName)

                const existing = await tx.instrumento.findUnique({
                    where: { tenantId_nome: { tenantId, nome } }
                })

                if (existing) {
                    if (existing.deletedAt) {
                        await tx.instrumento.update({
                            where: { id: existing.id },
                            data: { deletedAt: null }
                        })
                        inseridos++
                    } else {
                        ignorados++
                    }
                } else {
                    await tx.instrumento.create({
                        data: { nome, tenantId }
                    })
                    inseridos++
                }
            }
        })

        return {
            totalProcessados: records.length,
            inseridos,
            ignorados
        }
    }
}
