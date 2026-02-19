
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

export function globalErrorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
    const isProd = process.env.NODE_ENV === 'production'

    // Log error with Pino request logger if available, otherwise console
    if (request.log) {
        request.log.error(error)
    } else {
        console.error(error)
    }

    if (error instanceof ZodError) {
        return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation Error',
            issues: error.issues
        })
    }

    if ((error as FastifyError).validation) {
        return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: error.message
        })
    }

    const message = (error as any).message || 'Internal Server Error'

    // Map known errors
    if (message.includes('não encontrado') || message.includes('not found')) {
        return reply.status(404).send({ statusCode: 404, error: 'Not Found', message })
    }
    if (message.includes('inválido') || message.includes('invalid') || message.includes('obrigatória') || message.includes('required')) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message })
    }
    if (message.includes('already exists') || message.includes('duplicado') || (error as any).code === 'P2002') {
        return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Registro duplicado ou conflito de dados.' })
    }
    if (message.includes('Unauthorized') || message.includes('não autorizado')) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message })
    }
    if (message.includes('Forbidden') || message.includes('sem permissão')) {
        return reply.status(403).send({ statusCode: 403, error: 'Forbidden', message })
    }

    // Default 500
    return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: isProd ? 'Erro interno do servidor' : message,
        stack: isProd ? undefined : error.stack
    })
}
