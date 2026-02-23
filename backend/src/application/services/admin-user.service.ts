
import { prisma } from '../../infra/database/prisma.client'
import bcrypt from 'bcryptjs'

export class AdminUserService {
    async list(tenantId: string, userRole?: string, userRegionalId?: string) {
        const where: any = { tenantId, deletedAt: null }
        if (userRole === 'ADMIN_REGIONAL' && userRegionalId) {
            where.regionalId = userRegionalId
        }
        return prisma.user.findMany({
            where,
            include: {
                ensaioRegional: { select: { nome: true } },
                regional: { select: { nome: true } }
            },
            orderBy: { name: 'asc' }
        })
    }

    async getById(id: string, tenantId: string, userRole?: string, userRegionalId?: string) {
        const where: any = { id, tenantId, deletedAt: null }
        if (userRole === 'ADMIN_REGIONAL' && userRegionalId) {
            where.regionalId = userRegionalId
        }
        return prisma.user.findFirst({
            where,
            include: {
                ensaioRegional: true,
                regional: true
            }
        })
    }

    async create(data: { name: string, email: string, passwordHash: string, role: string, ensaioRegionalId?: string, regionalId?: string }, tenantId: string, userRole?: string, userRegionalId?: string) {
        // Check for existing user in tenant
        const existing = await prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId,
                    email: data.email
                }
            }
        })

        if (existing) {
            if (existing.deletedAt) {
                throw new Error('Usuário com este e-mail já existe (foi removido).')
            }
            throw new Error('Usuário com este e-mail já existe.')
        }

        // Admin regional só pode criar usuários na sua regional e só com role USER ou ADMIN_REGIONAL
        let effectiveRegionalId = data.regionalId
        let effectiveRole = data.role
        if (userRole === 'ADMIN_REGIONAL' && userRegionalId) {
            effectiveRegionalId = userRegionalId
            if (effectiveRole !== 'USER' && effectiveRole !== 'ADMIN_REGIONAL') {
                effectiveRole = 'USER'
            }
        }

        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(data.passwordHash, salt)

        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: effectiveRole as any,
                tenantId,
                ensaioRegionalId: data.ensaioRegionalId,
                regionalId: effectiveRegionalId,
                acessoLiberado: !!data.ensaioRegionalId
            }
        })
    }

    async update(id: string, data: { name?: string, email?: string, password?: string, role?: string, ensaioRegionalId?: string | null, regionalId?: string | null }, tenantId: string, userRole?: string, userRegionalId?: string) {
        const user = await this.getById(id, tenantId, userRole, userRegionalId)
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
        if (userRole === 'ADMIN_REGIONAL' && userRegionalId) {
            updateData.regionalId = userRegionalId
            if (updateData.role && updateData.role !== 'USER' && updateData.role !== 'ADMIN_REGIONAL') {
                updateData.role = user.role
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

        return prisma.user.update({
            where: { id },
            data: updateData
        })
    }

    async delete(id: string, requesterId: string, tenantId: string, userRole?: string, userRegionalId?: string) {
        if (id === requesterId) throw new Error('Não é possível excluir a si mesmo.')

        const user = await this.getById(id, tenantId, userRole, userRegionalId)
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

    async assignEvento(userId: string, eventoId: string | null, tenantId: string, userRole?: string, userRegionalId?: string) {
        const user = await this.getById(userId, tenantId, userRole, userRegionalId)
        if (!user) throw new Error('Usuário não encontrado.')

        if (eventoId) {
            const eventoWhere: any = { id: eventoId, tenantId, deletedAt: null }
            if (userRole === 'ADMIN_REGIONAL' && userRegionalId) {
                eventoWhere.regionalId = userRegionalId
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
