
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { AdminUserService } from '../../../../application/services/admin-user.service'

const service = new AdminUserService()

export class AdminUserController {
    async list(request: FastifyRequest, reply: FastifyReply) {
        const u = (request as any).user
        request.log?.info({ requesterId: u.userId, role: u.role }, 'User list accessed')
        // regionalId vem apenas do token; nunca usar querystring/body para filtro de segurança
        const users = await service.list(u.tenantId, u.role, u.regionalId, u.regionalIds)
        return reply.send(users)
    }

    async get(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const u = (request as any).user
        const user = await service.getById(id, u.tenantId, u.role, u.regionalId, u.regionalIds)
        if (!user) {
            if (u.role === 'ADMIN_REGIONAL') {
                const exists = await service.existsInTenant(id, u.tenantId)
                if (exists) return reply.status(403).send({ message: 'Forbidden' })
            }
            return reply.status(404).send({ message: 'User not found' })
        }
        return reply.send(user)
    }

    async create(request: FastifyRequest, reply: FastifyReply) {
        const schema = z.object({
            name: z.string().min(3),
            email: z.string().email(),
            password: z.string().min(6),
            role: z.enum(['SUPERADMIN', 'ADMIN_REGIONAL', 'USER']),
            ensaioRegionalId: z.string().uuid().optional().nullable(),
            regionalId: z.string().uuid().optional().nullable(),
            regionalIds: z.array(z.string().uuid()).optional()
        })

        const data = schema.parse(request.body)
        const u = (request as any).user

        try {
            const user = await service.create({
                name: data.name,
                email: data.email,
                passwordHash: data.password,
                role: data.role,
                ensaioRegionalId: data.ensaioRegionalId || undefined,
                regionalId: data.regionalId || undefined,
                regionalIds: data.regionalIds
            }, u.tenantId, u.role, u.regionalId, u.regionalIds)

            return reply.status(201).send(user)
        } catch (e: any) {
            return reply.status(400).send({ message: e.message })
        }
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const schema = z.object({
            name: z.string().min(3).optional(),
            email: z.string().email().optional(),
            password: z.string().min(6).optional(),
            role: z.enum(['SUPERADMIN', 'ADMIN_REGIONAL', 'USER']).optional(),
            ensaioRegionalId: z.string().uuid().optional().nullable(),
            regionalId: z.string().uuid().optional().nullable(),
            regionalIds: z.array(z.string().uuid()).optional()
        })

        const data = schema.parse(request.body)
        const u = (request as any).user
        if (u.role === 'SUPERADMIN' || u.role === 'ADMIN') {
            request.log?.info({ actorId: u.userId, targetUserId: id }, 'User regional update')
        }

        try {
            const user = await service.update(id, {
                ...data,
                ensaioRegionalId: data.ensaioRegionalId,
                regionalId: data.regionalId,
                regionalIds: data.regionalIds
            }, u.tenantId, u.role, u.regionalId, u.regionalIds)
            return reply.send(user)
        } catch (e: any) {
            if (e.message === 'Usuário não encontrado.' && u.role === 'ADMIN_REGIONAL') {
                const exists = await service.existsInTenant(id, u.tenantId)
                if (exists) return reply.status(403).send({ message: 'Forbidden' })
            }
            return reply.status(400).send({ message: e.message })
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const u = (request as any).user

        try {
            await service.delete(id, u.userId, u.tenantId, u.role, u.regionalId, u.regionalIds)
            return reply.status(204).send()
        } catch (e: any) {
            if (e.message === 'Usuário não encontrado.' && u.role === 'ADMIN_REGIONAL') {
                const exists = await service.existsInTenant(id, u.tenantId)
                if (exists) return reply.status(403).send({ message: 'Forbidden' })
            }
            return reply.status(400).send({ message: e.message })
        }
    }

    async assignEvento(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const schema = z.object({
            evento_id: z.string().uuid().nullable()
        })

        const { evento_id } = schema.parse(request.body)
        const u = (request as any).user

        try {
            const user = await service.assignEvento(id, evento_id, u.tenantId, u.role, u.regionalId, u.regionalIds)
            return reply.send(user)
        } catch (e: any) {
            if (e.message === 'Usuário não encontrado.' && u.role === 'ADMIN_REGIONAL') {
                const exists = await service.existsInTenant(id, u.tenantId)
                if (exists) return reply.status(403).send({ message: 'Forbidden' })
            }
            return reply.status(400).send({ message: e.message })
        }
    }
}
