
import { prisma } from '../database/prisma.client'

export class InstrumentoRepository {
    async create(data: { nome: string }, tenantId: string) {
        return prisma.instrumento.create({
            data: {
                nome: data.nome,
                tenantId
            }
        })
    }

    async update(id: string, data: { nome: string }, tenantId: string) {
        const exists = await this.findById(id, tenantId)
        if (!exists) return null

        return prisma.instrumento.update({
            where: { id },
            data: { nome: data.nome }
        })
    }

    async list(tenantId: string) {
        return prisma.instrumento.findMany({
            where: {
                tenantId,
                deletedAt: null
            },
            orderBy: { nome: 'asc' }
        })
    }

    async findById(id: string, tenantId: string) {
        return prisma.instrumento.findFirst({
            where: {
                id,
                tenantId,
                deletedAt: null
            }
        })
    }

    async findByName(nome: string, tenantId: string) {
        return prisma.instrumento.findFirst({
            where: {
                tenantId,
                nome,
                deletedAt: null
            }
        })
    }

    async findByNameIncludingDeleted(nome: string, tenantId: string) {
        return prisma.instrumento.findUnique({
            where: {
                tenantId_nome: {
                    tenantId,
                    nome
                }
            }
        })
    }

    async restore(id: string) {
        return prisma.instrumento.update({
            where: { id },
            data: { deletedAt: null }
        })
    }

    async softDelete(id: string, tenantId: string) {
        const exists = await this.findById(id, tenantId)
        if (!exists) return null

        return prisma.instrumento.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
    }
}
