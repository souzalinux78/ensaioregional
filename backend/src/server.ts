
import fastify from 'fastify'
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import { authRoutes } from './interfaces/http/routes/auth.routes'
import { adminRoutes } from './interfaces/http/routes/admin.routes'
import { adminUsersRoutes } from './interfaces/http/routes/admin-users.routes'
import { presencaRoutes } from './interfaces/http/routes/presenca.routes'
import dotenv from 'dotenv'
import { ZodError } from 'zod'
import { globalErrorHandler } from './infra/http/error-handler'

dotenv.config()

const app = fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV !== 'production' ? {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        } : undefined,
    },
    disableRequestLogging: false
})

// Security Headers
app.register(helmet, {
    global: true,
})

// CORS
app.register(cors, {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
})

// Rate Limiting (Global protection)
app.register(rateLimit, {
    global: true,
    max: 100, // global limit per IP per timeWindow
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost']
})

// Multipart (Uploads) max 2MB
app.register(multipart, {
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    }
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// Authentication
app.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
})

app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'cookiesecret',
    hook: 'onRequest',
})

// Routes
app.register(authRoutes, { prefix: '/auth' })
app.register(adminRoutes, { prefix: '/admin' })
app.register(adminUsersRoutes, { prefix: '/admin/users' })
app.register(presencaRoutes, { prefix: '/presenca' })

// Global Error Handler
app.setErrorHandler((error, request, reply) => {
    return globalErrorHandler(error as any, request as any, reply as any)
})

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3333
        await app.listen({ port, host: '0.0.0.0' })
        console.log(`Server running on http://localhost:${port}`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
