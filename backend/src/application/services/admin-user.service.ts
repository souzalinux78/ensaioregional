
import { prisma } from '../../infra/database/prisma.client'
import bcrypt from 'bcryptjs'

export class AdminUserService {
    async list(tenantId: string) {
        return prisma.user.findMany({
            where: {
                tenantId,
                deletedAt: null
            },
            include: {
                ensaioRegional: {
                    select: { nome: true }
                }
            },
            orderBy: { name: 'asc' }
        })
    }

    async getById(id: string, tenantId: string) {
        return prisma.user.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                ensaioRegional: true
            }
        })
    }

    async create(data: { name: string, email: string, passwordHash: string, role: 'ADMIN' | 'USER', ensaioRegionalId?: string }, tenantId: string) {
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
                // Restore if needed, but usually we just want to update or throw
                throw new Error('Usuário com este e-mail já existe (foi removido).')
            }
            throw new Error('Usuário com este e-mail já existe.')
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(data.passwordHash, salt)

        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: data.role,
                tenantId,
                ensaioRegionalId: data.ensaioRegionalId,
                acessoLiberado: !!data.ensaioRegionalId
            }
        })
    }

    async update(id: string, data: { name?: string, email?: string, password?: string, role?: 'ADMIN' | 'USER', ensaioRegionalId?: string | null }, tenantId: string) {
        const user = await this.getById(id, tenantId)
        if (!user) throw new Error('Usuário não encontrado.')

        // Check email uniqueness if changing
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
            ensaioRegionalId: data.ensaioRegionalId
        }

        if (data.ensaioRegionalId !== undefined) {
            updateData.acessoLiberado = !!data.ensaioRegionalId
        }

        if (data.password) {
            const salt = await bcrypt.genSalt(10)
            updateData.passwordHash = await bcrypt.hash(data.password, salt)
        }

        // Security: Prevent removing last ADMIN
        if (data.role === 'USER' && user.role === 'ADMIN') {
            const adminCount = await prisma.user.count({
                where: { tenantId, role: 'ADMIN', deletedAt: null }
            })
            if (adminCount <= 1) throw new Error('Não é possível remover o último administrador do tenant.')
        }

        return prisma.user.update({
            where: { id },
            data: updateData
        })
    }

    async delete(id: string, requesterId: string, tenantId: string) {
        if (id === requesterId) throw new Error('Não é possível excluir a si mesmo.')

        const user = await this.getById(id, tenantId)
        if (!user) throw new Error('Usuário não encontrado.')

        if (user.role === 'ADMIN') {
            const adminCount = await prisma.user.count({
                where: { tenantId, role: 'ADMIN', deletedAt: null }
            })
            if (adminCount <= 1) throw new Error('Não é possível excluir o último administrador do tenant.')
        }

        return prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
    }

    async assignEvento(userId: string, eventoId: string | null, tenantId: string) {
        const user = await this.getById(userId, tenantId)
        if (!user) throw new Error('Usuário não encontrado.')

        if (eventoId) {
            const evento = await prisma.ensaioRegional.findFirst({
                where: { id: eventoId, tenantId, deletedAt: null }
            })
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
