
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../../../infra/database/prisma.client'

function normalize(text: string) {
    return text.trim().toUpperCase().replace(/\s+/g, ' ')
}

export class AdminFuncaoController {
    async list(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const funcoes = await prisma.funcaoMinisterio.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { nome: 'asc' },
            select: { id: true, nome: true }
        })
        return reply.send(funcoes)
    }

    async create(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const schema = z.object({ nome: z.string().min(2) })
        const { nome } = schema.parse(request.body)
        const nomeNorm = normalize(nome)

        try {
            const result = await prisma.funcaoMinisterio.upsert({
                where: { tenantId_nome: { tenantId, nome: nomeNorm } },
                update: { deletedAt: null },
                create: { tenantId, nome: nomeNorm },
            })
            return reply.status(201).send(result)
        } catch (e: any) {
            throw e
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const { id } = request.params as { id: string }

        const record = await prisma.funcaoMinisterio.findFirst({
            where: { id, tenantId, deletedAt: null }
        })
        if (!record) return reply.status(404).send({ message: 'Not found' })

        await prisma.funcaoMinisterio.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
        return reply.status(204).send()
    }
}
