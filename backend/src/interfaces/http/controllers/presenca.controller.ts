
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { PresencaService } from '../../../application/services/presenca.service'

const service = new PresencaService()

export class PresencaController {
    async create(request: FastifyRequest, reply: FastifyReply) {
        const schema = z.object({
            funcaoMinisterio: z.string().min(2),
            cidadeId: z.string().uuid().optional(),
            cidadeNome: z.string().min(2).optional(),
            instrumentoId: z.string().uuid().optional(),
            instrumentoNome: z.string().min(2).optional()
        }).refine(data => data.cidadeId || data.cidadeNome, {
            message: "Cidade é obrigatória.",
            path: ["cidadeId"]
        })

        const data = schema.parse(request.body)
        const user = (request as any).user

        try {
            const result = await service.create({
                userId: user.userId,
                tenantId: user.tenantId,
                funcaoMinisterio: data.funcaoMinisterio,
                cidadeId: data.cidadeId,
                cidadeNome: data.cidadeNome,
                instrumentoId: data.instrumentoId,
                instrumentoNome: data.instrumentoNome
            })
            return reply.status(201).send(result)
        } catch (e: any) {
            // Handle Zod Error explicitly if needed but global handler does it.
            // Handle Service Errors
            if (e.message.includes('não vinculado') || e.message.includes('não encontrado') || e.message.includes('inválido')) {
                return reply.status(400).send({ message: e.message })
            }
            throw e
        }
    }

    async listCidades(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user
            const result = await service.listCidades(user.tenantId)
            return reply.send(result)
        } catch (e: any) {
            throw e
        }
    }

    async listInstrumentos(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = (request as any).user
            const result = await service.listInstrumentos(user.tenantId)
            return reply.send(result)
        } catch (e: any) {
            throw e
        }
    }
    async listFuncoes(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user
        const funcoes = await service.listFuncoes(user.tenantId)
        return reply.send(funcoes)
    }

    async getActiveEvent(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user
        const event = await service.getActiveEvent(user.tenantId, user.userId)
        return reply.send(event)
    }
}
