
import { prisma } from '../../infra/database/prisma.client'

export class RegionalService {
    async list(tenantId: string) {
        return prisma.regional.findMany({
            where: { tenantId },
            orderBy: { nome: 'asc' }
        })
    }

    async findById(id: string, tenantId: string) {
        return prisma.regional.findFirst({
            where: { id, tenantId }
        })
    }

    async create(data: { nome: string; setor?: string }, tenantId: string) {
        return prisma.regional.create({
            data: {
                nome: data.nome.toUpperCase(),
                setor: data.setor?.toUpperCase(),
                tenantId
            }
        })
    }

    async update(id: string, data: { nome?: string; setor?: string; ativo?: boolean }, tenantId: string) {
        return prisma.regional.update({
            where: { id },
            data: {
                nome: data.nome?.toUpperCase(),
                setor: data.setor?.toUpperCase(),
                ativo: data.ativo
            }
        })
    }

    async delete(id: string, tenantId: string) {
        // Check if there are users or events linked
        const usersCount = await prisma.user.count({ where: { regionalId: id } })
        const eventsCount = await prisma.ensaioRegional.count({ where: { regionalId: id } })

        if (usersCount > 0 || eventsCount > 0) {
            throw new Error('Não é possível excluir regional com usuários ou eventos vinculados.')
        }

        return prisma.regional.delete({
            where: { id }
        })
    }
}
