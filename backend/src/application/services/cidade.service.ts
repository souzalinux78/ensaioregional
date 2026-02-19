
import { prisma } from '../../infra/database/prisma.client'
import { CidadeRepository } from '../../infra/repositories/cidade.repository'
import { parse } from 'csv-parse'
import { Readable } from 'stream'
import { AuditService } from './audit.service'

export class CidadeService {
    private repository: CidadeRepository

    constructor() {
        this.repository = new CidadeRepository()
    }

    private normalize(nome: string) {
        return nome.trim().toUpperCase().replace(/\s+/g, ' ')
    }

    async create(data: { nomeCidade: string, nomeBairro?: string }, tenantId: string) {
        const cidade = this.normalize(data.nomeCidade)
        const bairro = data.nomeBairro ? this.normalize(data.nomeBairro) : null

        if (cidade.includes('-')) {
            throw new Error('Nome da cidade não pode conter o caractere "-"')
        }

        const nomeExibicao = bairro ? `${cidade} - ${bairro}` : cidade

        // 1. Check logical existence
        const existing = await this.repository.findByNameIncludingDeleted(nomeExibicao, tenantId)
        if (existing) {
            if (existing.deletedAt) {
                return this.repository.restore(existing.id)
            }
            return existing
        }

        // 2. Optimistic Create
        try {
            return await this.repository.create({
                nomeCidade: cidade,
                nomeBairro: bairro as string,
                nomeExibicao
            }, tenantId)
        } catch (e: any) {
            // 3. Handle Race Condition
            if (e.code === 'P2002') {
                const retry = await this.repository.findByNameIncludingDeleted(nomeExibicao, tenantId)
                if (retry) {
                    if (retry.deletedAt) return this.repository.restore(retry.id)
                    return retry
                }
            }
            throw e
        }
    }

    async findOrCreateByName(rawName: string, tenantId: string) {
        let nomeCidade = rawName
        let nomeBairro = undefined

        if (rawName.includes(' - ')) {
            const parts = rawName.split(' - ')
            nomeCidade = parts[0].trim()
            nomeBairro = parts[1].trim()
        }

        return this.create({ nomeCidade, nomeBairro }, tenantId)
    }

    async update(id: string, data: { nomeCidade: string, nomeBairro?: string }, tenantId: string) {
        const cidade = this.normalize(data.nomeCidade)
        const bairro = data.nomeBairro ? this.normalize(data.nomeBairro) : null

        if (cidade.includes('-')) {
            throw new Error('Nome da cidade não pode conter o caractere "-"')
        }

        const nomeExibicao = bairro ? `${cidade} - ${bairro}` : cidade

        const existing = await this.repository.findByNameIncludingDeleted(nomeExibicao, tenantId)
        if (existing && existing.id !== id) {
            throw new Error('Cidade with this name already exists')
        }

        return this.repository.update(id, {
            nomeCidade: cidade,
            nomeBairro: bairro as string,
            nomeExibicao
        }, tenantId)
    }

    async list(tenantId: string) {
        return this.repository.list(tenantId)
    }

    async delete(id: string, tenantId: string, userId: string) {
        const result = await this.repository.softDelete(id, tenantId)
        if (result) {
            await AuditService.log({
                tenantId,
                userId,
                action: 'DELETE',
                entity: 'Cidade',
                entityId: id
            })
        }
        return result
    }

    async findById(id: string, tenantId: string) {
        return this.repository.findById(id, tenantId)
    }

    async importCsv(fileBuffer: Buffer, tenantId: string, userId: string) {
        const parser = parse(fileBuffer, {
            delimiter: [',', ';'],
            columns: false,
            skip_empty_lines: true,
            trim: true,
            relax_quotes: true
        })

        const records: any[] = []
        for await (const record of parser) {
            records.push(record)
        }

        let inseridos = 0
        let ignorados = 0

        await prisma.$transaction(async (tx) => {
            for (const record of records) {
                const rawName = Array.isArray(record) ? record[0] : record.nome
                if (!rawName || rawName.length < 2) continue

                let nomeCidade = rawName
                let nomeBairro = null

                if (rawName.includes(' - ')) {
                    const parts = rawName.split(' - ')
                    nomeCidade = parts[0].trim()
                    nomeBairro = parts[1].trim()
                }

                const normCidade = this.normalize(nomeCidade)
                const normBairro = nomeBairro ? this.normalize(nomeBairro) : null
                const nomeExibicao = normBairro ? `${normCidade} - ${normBairro}` : normCidade

                const existingList = await tx.cidade.findMany({
                    where: { tenantId, nome: nomeExibicao }
                })
                const existing = existingList[0]

                if (existing) {
                    if (existing.deletedAt) {
                        await (tx.cidade as any).update({
                            where: { id: existing.id },
                            data: {
                                deletedAt: null,
                                nomeCidade: normCidade,
                                nomeBairro: normBairro,
                                nomeExibicao
                            }
                        })
                        inseridos++
                    } else {
                        ignorados++
                    }
                } else {
                    await (tx.cidade as any).create({
                        data: {
                            nome: nomeExibicao,
                            nomeCidade: normCidade,
                            nomeBairro: normBairro,
                            nomeExibicao,
                            tenantId
                        }
                    })
                    inseridos++
                }
            }
        })

        await AuditService.log({
            tenantId,
            userId,
            action: 'IMPORT_CSV',
            entity: 'Cidade',
            entityId: 'BULK',
            details: `Inseridos: ${inseridos}, Ignorados: ${ignorados}`
        })

        return {
            totalProcessados: records.length,
            inseridos,
            ignorados
        }
    }
}
