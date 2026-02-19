
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { InstrumentoService } from '../../../../application/services/instrumento.service'

const service = new InstrumentoService()

export class AdminInstrumentoController {
    async create(request: FastifyRequest, reply: FastifyReply) {
        const schema = z.object({
            nome: z.string().min(2)
        })
        const data = schema.parse(request.body)
        const tenantId = (request as any).user.tenantId

        try {
            const result = await service.create(data, tenantId)
            return reply.status(201).send(result)
        } catch (e: any) {
            if (e.message.includes('exists')) return reply.status(409).send({ message: e.message })
            throw e
        }
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const schema = z.object({
            nome: z.string().min(2)
        })
        const data = schema.parse(request.body)
        const tenantId = (request as any).user.tenantId

        try {
            const result = await service.update(id, data, tenantId)
            if (!result) return reply.status(404).send({ message: 'Not found' })
            return reply.send(result)
        } catch (e: any) {
            if (e.message.includes('exists')) return reply.status(409).send({ message: e.message })
            throw e
        }
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        return service.list(tenantId)
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const tenantId = (request as any).user.tenantId

        const result = await service.delete(id, tenantId)
        if (!result) return reply.status(404).send({ message: 'Not found' })

        return reply.status(204).send()
    }

    async import(request: FastifyRequest, reply: FastifyReply) {
        const data = await request.file()
        if (!data) {
            return reply.status(400).send({ message: 'File is required' })
        }

        const buffer = await data.toBuffer()
        const tenantId = (request as any).user.tenantId

        const stats = await service.importCsv(buffer, tenantId)
        return reply.send(stats)
    }
}
