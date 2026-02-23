
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { EnsaioRegionalService } from '../../../../application/services/ensaio-regional.service'

const service = new EnsaioRegionalService()

interface AuthenticatedRequest extends FastifyRequest {
    user: {
        userId: string
        tenantId: string
        role: string
        regionalId?: string
        regionalIds?: string[]
    }
}

export class AdminEnsaioController {
    async create(request: FastifyRequest, reply: FastifyReply) {
        const req = request as AuthenticatedRequest
        const schema = z.object({
            nome: z.string().min(3),
            dataEvento: z.string(),
            dataHoraInicio: z.string(),
            dataHoraFim: z.string(),
            ativo: z.boolean().optional(),
            anciaoAtendimento: z.string().optional(),
            regionalRegente: z.string().optional(),
            regionalRegente2: z.string().optional(),
            regionalPrincipal: z.string().optional(),
            regionalSecundario: z.string().optional(),
            localEvento: z.string().optional(),
            cidadeEvento: z.string().optional(),
            tipoResponsavelPrincipal: z.string().optional(),
            tipoResponsavelSecundario: z.string().optional(),
            modoConvocacao: z.boolean().optional()
        })

        const data = schema.parse(req.body)
        const result = await service.create(data, req.user.tenantId, req.user.userId, req.user.role, req.user.regionalId, req.user.regionalIds)
        return reply.status(201).send(result)
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        const req = request as AuthenticatedRequest
        const result = await service.list(req.user.tenantId, req.user.role, req.user.regionalId, req.user.regionalIds)
        return reply.send(result)
    }

    async get(request: FastifyRequest, reply: FastifyReply) {
        const req = request as AuthenticatedRequest
        const { id } = req.params as { id: string }
        const result = await service.findById(id, req.user.tenantId, req.user.role, req.user.regionalId, req.user.regionalIds)
        if (!result) return reply.status(404).send({ message: 'Not found' })
        return reply.send(result)
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        const req = request as AuthenticatedRequest
        const { id } = req.params as { id: string }
        const schema = z.object({
            nome: z.string().min(3).optional(),
            dataEvento: z.string().optional(),
            dataHoraInicio: z.string().optional(),
            dataHoraFim: z.string().optional(),
            ativo: z.boolean().optional(),
            anciaoAtendimento: z.string().optional(),
            regionalRegente: z.string().optional(),
            regionalRegente2: z.string().optional(),
            regionalPrincipal: z.string().optional(),
            regionalSecundario: z.string().optional(),
            localEvento: z.string().optional(),
            cidadeEvento: z.string().optional(),
            tipoResponsavelPrincipal: z.string().optional(),
            tipoResponsavelSecundario: z.string().optional(),
            modoConvocacao: z.boolean().optional()
        })

        const data = schema.parse(req.body)
        try {
            const result = await service.update(id, data, req.user.tenantId, req.user.userId, req.user.role, req.user.regionalId, req.user.regionalIds)
            return reply.send(result)
        } catch (e: any) {
            if (e.message === 'Not found') return reply.status(404).send({ message: 'Not found' })
            throw e
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const req = request as AuthenticatedRequest
        const { id } = req.params as { id: string }
        try {
            await service.delete(id, req.user.tenantId, req.user.userId, req.user.role, req.user.regionalId, req.user.regionalIds)
            return reply.status(204).send()
        } catch (e: any) {
            if (e.message === 'Not found') return reply.status(404).send({ message: 'Not found' })
            throw e
        }
    }

    async linkUser(request: FastifyRequest, reply: FastifyReply) {
        const req = request as AuthenticatedRequest
        const { id } = req.params as { id: string }
        const schema = z.object({
            ensaioId: z.string().uuid()
        })
        const { ensaioId } = schema.parse(req.body)

        try {
            const result = await service.linkUser(id, ensaioId, req.user.tenantId, req.user.role, req.user.regionalId, req.user.regionalIds)
            return reply.send(result)
        } catch (e: any) {
            if (e.message.includes('not found')) return reply.status(404).send({ message: e.message })
            throw e
        }
    }

    async summon(request: FastifyRequest, reply: FastifyReply) {
        const req = request as AuthenticatedRequest
        const { id } = req.params as { id: string }
        const schema = z.object({
            userIds: z.array(z.string().uuid())
        })
        const { userIds } = schema.parse(req.body)

        try {
            const result = await service.summonUsers(id, userIds, req.user.tenantId, req.user.userId, req.user.role, req.user.regionalId, req.user.regionalIds)
            return reply.send(result)
        } catch (e: any) {
            if (e.message.includes('não encontrado')) return reply.status(404).send({ message: e.message })
            throw e
        }
    }
}
