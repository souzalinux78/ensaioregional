
import { FastifyReply, FastifyRequest } from 'fastify'

export function roleGuard(...allowedRoles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user
        if (!user) {
            await reply.status(401).send({ message: 'Unauthorized' })
            return
        }

        // SUPERADMIN and legacy ADMIN bypass most admin guards
        if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') {
            return
        }

        if (!allowedRoles.includes(user.role)) {
            await reply.status(403).send({ message: 'Forbidden' })
            return
        }
    }
}
