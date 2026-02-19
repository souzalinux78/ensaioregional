
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { AdminUserService } from '../../../../application/services/admin-user.service'

const service = new AdminUserService()

export class AdminUserController {
    async list(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const users = await service.list(tenantId)
        return reply.send(users)
    }

    async get(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const tenantId = (request as any).user.tenantId
        const user = await service.getById(id, tenantId)
        if (!user) return reply.status(404).send({ message: 'User not found' })
        return reply.send(user)
    }

    async create(request: FastifyRequest, reply: FastifyReply) {
        const schema = z.object({
            name: z.string().min(3),
            email: z.string().email(),
            password: z.string().min(6),
            role: z.enum(['ADMIN', 'USER']),
            ensaioRegionalId: z.string().uuid().optional().nullable()
        })

        const data = schema.parse(request.body)
        const tenantId = (request as any).user.tenantId

        try {
            const user = await service.create({
                name: data.name,
                email: data.email,
                passwordHash: data.password, // temporary rename for service call
                role: data.role,
                ensaioRegionalId: data.ensaioRegionalId || undefined
            }, tenantId)

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
            role: z.enum(['ADMIN', 'USER']).optional(),
            ensaioRegionalId: z.string().uuid().optional().nullable()
        })

        const data = schema.parse(request.body)
        const tenantId = (request as any).user.tenantId

        try {
            const user = await service.update(id, {
                ...data,
                ensaioRegionalId: data.ensaioRegionalId
            }, tenantId)
            return reply.send(user)
        } catch (e: any) {
            return reply.status(400).send({ message: e.message })
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const tenantId = (request as any).user.tenantId
        const requesterId = (request as any).user.sub

        try {
            await service.delete(id, requesterId, tenantId)
            return reply.status(204).send()
        } catch (e: any) {
            return reply.status(400).send({ message: e.message })
        }
    }

    async assignEvento(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const schema = z.object({
            evento_id: z.string().uuid().nullable()
        })

        const { evento_id } = schema.parse(request.body)
        const tenantId = (request as any).user.tenantId

        try {
            const user = await service.assignEvento(id, evento_id, tenantId)
            return reply.send(user)
        } catch (e: any) {
            return reply.status(400).send({ message: e.message })
        }
    }
}
