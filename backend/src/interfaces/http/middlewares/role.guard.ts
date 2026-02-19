
import { FastifyReply, FastifyRequest } from 'fastify'

export function roleGuard(requiredRole: 'ADMIN' | 'USER') {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user
        if (!user) {
            await reply.status(401).send({ message: 'Unauthorized' })
            return
        }

        if (user.role !== requiredRole) {
            await reply.status(403).send({ message: 'Forbidden' })
            return
        }
    }
}
