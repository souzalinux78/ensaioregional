import { prisma } from '../../infra/database/prisma.client'
import bcrypt from 'bcryptjs'

/** Normaliza para array de IDs: regionalIds do token ou [regionalId] (retrocompat). */
function asRegionalIds(regionalIds?: string[], regionalId?: string): string[] {
    if (Array.isArray(regionalIds) && regionalIds.length > 0) return regionalIds
    if (regionalId) return [regionalId]
    return []
}

export class AdminUserService {
    /**
     * Lista usuários. SUPERADMIN/ADMIN: todos do tenant.
     * ADMIN_REGIONAL: apenas usuários vinculados a pelo menos uma das suas regionais; nunca SUPERADMIN.
     * Filtro sempre do token (nunca do frontend).
     */
    async list(tenantId: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        const where: any = { tenantId, deletedAt: null }
        const ids = asRegionalIds(userRegionalIds, userRegionalId)

        if (userRole === 'ADMIN_REGIONAL') {
            if (ids.length === 0) return []
            where.role = { not: 'SUPERADMIN' }
            where.OR = [
                { userRegionais: { some: { regionalId: { in: ids } } } },
                { regionalId: { in: ids } }
            ]
        }

        return prisma.user.findMany({
            where,
            include: {
                ensaioRegional: { select: { nome: true } },
                regional: { select: { nome: true } },
                userRegionais: { include: { regional: { select: { id: true, nome: true } } } }
            },
            orderBy: { name: 'asc' }
        })
    }

    /** Verifica se existe usuário no tenant (para distinguir 403 vs 404). */
    async existsInTenant(id: string, tenantId: string): Promise<boolean> {
        const u = await prisma.user.findFirst({
            where: { id, tenantId },
            select: { id: true }
        })
        return !!u
    }

    async getById(id: string, tenantId: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        const ids = asRegionalIds(userRegionalIds, userRegionalId)
        const where: any = { id, tenantId, deletedAt: null }
        if (userRole === 'ADMIN_REGIONAL') {
            if (ids.length === 0) return null
            where.role = { not: 'SUPERADMIN' }
            where.OR = [
                { userRegionais: { some: { regionalId: { in: ids } } } },
                { regionalId: { in: ids } }
            ]
        }
        return prisma.user.findFirst({
            where,
            include: {
                ensaioRegional: true,
                regional: true,
                userRegionais: { include: { regional: { select: { id: true, nome: true } } } }
            }
        })
    }

    async create(data: { name: string, email: string, passwordHash: string, role: string, ensaioRegionalId?: string, regionalId?: string, regionalIds?: string[] }, tenantId: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        const existing = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: data.email } }
        })
        if (existing) {
            if (existing.deletedAt) throw new Error('Usuário com este e-mail já existe (foi removido).')
            throw new Error('Usuário com este e-mail já existe.')
        }

        let effectiveRole = data.role
        let regionalIdsToSet: string[] = []

        if (userRole === 'SUPERADMIN' || userRole === 'ADMIN') {
            if (Array.isArray(data.regionalIds) && data.regionalIds.length > 0) {
                regionalIdsToSet = data.regionalIds
            } else if (data.regionalId) {
                regionalIdsToSet = [data.regionalId]
            }
        } else if (userRole === 'ADMIN_REGIONAL') {
            regionalIdsToSet = asRegionalIds(userRegionalIds, userRegionalId)
            if (effectiveRole !== 'USER' && effectiveRole !== 'ADMIN_REGIONAL') effectiveRole = 'USER'
        }

        const firstRegionalId = regionalIdsToSet[0] ?? null
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(data.passwordHash, salt)

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: effectiveRole as any,
                tenantId,
                ensaioRegionalId: data.ensaioRegionalId,
                regionalId: firstRegionalId,
                acessoLiberado: !!data.ensaioRegionalId
            }
        })

        if (regionalIdsToSet.length > 0) {
            await prisma.userRegional.createMany({
                data: regionalIdsToSet.map((regionalId) => ({ userId: user.id, regionalId }))
            })
        }

        return prisma.user.findUnique({
            where: { id: user.id },
            include: {
                ensaioRegional: true,
                regional: true,
                userRegionais: { include: { regional: { select: { id: true, nome: true } } } }
            }
        }) as Promise<any>
    }

    async update(id: string, data: { name?: string, email?: string, password?: string, role?: string, ensaioRegionalId?: string | null, regionalId?: string | null, regionalIds?: string[] }, tenantId: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        const user = await this.getById(id, tenantId, userRole, userRegionalId, userRegionalIds)
        if (!user) throw new Error('Usuário não encontrado.')

        if (data.email && data.email !== user.email) {
            const existing = await prisma.user.findUnique({
                where: { tenantId_email: { tenantId, email: data.email } }
            })
            if (existing) throw new Error('Este e-mail já está em uso por outro usuário.')
        }

        const updateData: any = {
            name: data.name,
            email: data.email,
            role: data.role,
            ensaioRegionalId: data.ensaioRegionalId,
            regionalId: data.regionalId
        }
        if (userRole === 'ADMIN_REGIONAL') {
            const ids = asRegionalIds(userRegionalIds, userRegionalId)
            if (ids.length > 0) updateData.regionalId = ids[0]
            if (updateData.role && updateData.role !== 'USER' && updateData.role !== 'ADMIN_REGIONAL') {
                updateData.role = user.role
            }
        }
        if ((userRole === 'SUPERADMIN' || userRole === 'ADMIN') && Array.isArray(data.regionalIds)) {
            const newIds = data.regionalIds.filter(Boolean)
            updateData.regionalId = newIds[0] ?? null
            await prisma.userRegional.deleteMany({ where: { userId: id } })
            if (newIds.length > 0) {
                await prisma.userRegional.createMany({
                    data: newIds.map((regionalId) => ({ userId: id, regionalId }))
                })
            }
        }

        if (data.ensaioRegionalId !== undefined) {
            updateData.acessoLiberado = !!data.ensaioRegionalId
        }

        if (data.password) {
            const salt = await bcrypt.genSalt(10)
            updateData.passwordHash = await bcrypt.hash(data.password, salt)
        }

        if ((data.role === 'USER' || data.role === 'ADMIN_REGIONAL') && (user.role === 'SUPERADMIN' || user.role === 'ADMIN')) {
            const adminCount = await prisma.user.count({
                where: {
                    tenantId,
                    role: { in: ['SUPERADMIN', 'ADMIN'] },
                    deletedAt: null
                }
            })
            if (adminCount <= 1) throw new Error('Não é possível remover o último administrador global do tenant.')
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData
        })
        return prisma.user.findUnique({
            where: { id: updated.id },
            include: {
                ensaioRegional: true,
                regional: true,
                userRegionais: { include: { regional: { select: { id: true, nome: true } } } }
            }
        }) as Promise<any>
    }

    async delete(id: string, requesterId: string, tenantId: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        if (id === requesterId) throw new Error('Não é possível excluir a si mesmo.')

        const user = await this.getById(id, tenantId, userRole, userRegionalId, userRegionalIds)
        if (!user) throw new Error('Usuário não encontrado.')

        if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') {
            const adminCount = await prisma.user.count({
                where: {
                    tenantId,
                    role: { in: ['SUPERADMIN', 'ADMIN'] },
                    deletedAt: null
                }
            })
            if (adminCount <= 1) throw new Error('Não é possível excluir o último administrador global do tenant.')
        }

        return prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
    }

    async assignEvento(userId: string, eventoId: string | null, tenantId: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        const user = await this.getById(userId, tenantId, userRole, userRegionalId, userRegionalIds)
        if (!user) throw new Error('Usuário não encontrado.')

        const ids = asRegionalIds(userRegionalIds, userRegionalId)
        if (eventoId) {
            const eventoWhere: any = { id: eventoId, tenantId, deletedAt: null }
            if (userRole === 'ADMIN_REGIONAL' && ids.length > 0) {
                eventoWhere.regionalId = { in: ids }
            }
            const evento = await prisma.ensaioRegional.findFirst({ where: eventoWhere })
            if (!evento) throw new Error('Evento não encontrado para este tenant.')
        }

        return prisma.user.update({
            where: { id: userId },
            data: {
                ensaioRegionalId: eventoId,
                acessoLiberado: !!eventoId
            }
        })
    }
}
