
import { FastifyReply, FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret'

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization
        if (!authHeader) {
            await reply.status(401).send({ message: 'Unauthorized' })
            return
        }

        const token = authHeader.replace('Bearer ', '')
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any

            ; (request as any).user = {
                userId: decoded.userId,
                tenantId: decoded.tenantId,
                role: decoded.role,
            }
    } catch (err) {
        await reply.status(401).send({ message: 'Invalid token' })
        return
    }
}
