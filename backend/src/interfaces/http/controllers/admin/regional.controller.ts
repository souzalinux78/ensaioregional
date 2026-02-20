
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { RegionalService } from '../../../../application/services/regional.service'

const service = new RegionalService()

export class RegionalController {
    async list(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const regionals = await service.list(tenantId)
        return reply.send(regionals)
    }

    async create(request: FastifyRequest, reply: FastifyReply) {
        const schema = z.object({
            nome: z.string().min(3),
            setor: z.string().optional()
        })

        const data = schema.parse(request.body)
        const tenantId = (request as any).user.tenantId

        const result = await service.create(data, tenantId)
        return reply.status(201).send(result)
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const schema = z.object({
            nome: z.string().min(3).optional(),
            setor: z.string().optional(),
            ativo: z.boolean().optional()
        })

        const data = schema.parse(request.body)
        const tenantId = (request as any).user.tenantId

        const result = await service.update(id, data, tenantId)
        return reply.send(result)
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const tenantId = (request as any).user.tenantId

        try {
            await service.delete(id, tenantId)
            return reply.status(204).send()
        } catch (e: any) {
            return reply.status(400).send({ message: e.message })
        }
    }
}
