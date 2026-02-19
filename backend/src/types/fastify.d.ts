
import { FastifyRequest } from 'fastify'

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            userId: string
            tenantId: string
            role: 'ADMIN' | 'USER'
        }
    }
}
