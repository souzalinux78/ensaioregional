
import { prisma } from '../database/prisma.client'

export class CidadeRepository {
    async create(data: { nomeCidade: string, nomeBairro?: string, nomeExibicao: string }, tenantId: string) {
        return (prisma.cidade as any).create({
            data: {
                nome: data.nomeExibicao, // legacy sync
                nomeCidade: data.nomeCidade,
                nomeBairro: data.nomeBairro,
                nomeExibicao: data.nomeExibicao,
                tenantId
            }
        })
    }

    async update(id: string, data: { nomeCidade: string, nomeBairro?: string, nomeExibicao: string }, tenantId: string) {
        const exists = await this.findById(id, tenantId)
        if (!exists) return null

        return (prisma.cidade as any).update({
            where: { id },
            data: {
                nome: data.nomeExibicao,
                nomeCidade: data.nomeCidade,
                nomeBairro: data.nomeBairro,
                nomeExibicao: data.nomeExibicao
            }
        })
    }

    async list(tenantId: string) {
        return prisma.cidade.findMany({
            where: {
                tenantId,
                deletedAt: null
            },
            orderBy: { nome: 'asc' }
        })
    }

    async findById(id: string, tenantId: string) {
        return prisma.cidade.findFirst({
            where: {
                id,
                tenantId,
                deletedAt: null
            }
        })
    }

    async findByName(nome: string, tenantId: string) {
        return prisma.cidade.findFirst({
            where: {
                tenantId,
                nome,
                deletedAt: null
            }
        })
    }

    async findByExactMatch(nomeCidade: string, nomeBairro: string | null, tenantId: string) {
        return (prisma.cidade as any).findFirst({
            where: {
                tenantId,
                nomeCidade,
                nomeBairro,
                deletedAt: null
            }
        })
    }

    async findByNameIncludingDeleted(nome: string, tenantId: string) {
        return prisma.cidade.findUnique({
            where: {
                tenantId_nome: {
                    tenantId,
                    nome
                }
            }
        })
    }

    async restore(id: string) {
        return prisma.cidade.update({
            where: { id },
            data: { deletedAt: null }
        })
    }

    async softDelete(id: string, tenantId: string) {
        const exists = await this.findById(id, tenantId)
        if (!exists) return null

        return prisma.cidade.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
    }
}
