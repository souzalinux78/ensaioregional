
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../../../application/services/auth.service'

const authService = new AuthService()

export class AuthController {
    async login(request: FastifyRequest, reply: FastifyReply) {
        const loginSchema = z.object({
            email: z.string().email(),
            password: z.string().min(1),
        })

        const { email, password } = loginSchema.parse(request.body)

        try {
            const tokens = await authService.login(email, password)

            // Set refresh token in HTTP-only cookie
            reply.setCookie('refreshToken', tokens.refreshToken, {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax',
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })

            return reply.send({
                accessToken: tokens.accessToken,
            })
        } catch (err: any) {
            if (err.statusCode) {
                return reply.status(err.statusCode).send({ message: err.message })
            }
            if (err.message === 'Invalid credentials') {
                return reply.status(401).send({ message: 'Credenciais inválidas' })
            }
            return reply.status(500).send({ message: 'Erro interno no servidor' })
        }
    }

    async refresh(request: FastifyRequest, reply: FastifyReply) {
        console.log('REFRESH REQUEST:', request.cookies)
        const refreshToken = request.cookies.refreshToken

        if (!refreshToken) {
            console.log('No refresh token cookie')
            return reply.status(401).send({ message: 'Refresh token missing' })
        }

        try {
            console.log('Calling service refresh with:', refreshToken.substring(0, 10))
            const tokens = await authService.refresh(refreshToken)
            console.log('Service refresh success')

            reply.setCookie('refreshToken', tokens.refreshToken, {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax',
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })

            return reply.send({
                accessToken: tokens.accessToken,
            })
        } catch (err: any) {
            console.error('REFRESH ERROR CAUGHT:', err)
            // Clear cookie if error (revoked, expired, etc)
            reply.clearCookie('refreshToken', { path: '/' })
            return reply.status(401).send({ message: 'Unauthorized' })
        }
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        const refreshToken = request.cookies.refreshToken

        if (refreshToken) {
            try {
                await authService.logout(refreshToken)
            } catch (e) {
                // Ignore if already invalid
            }
        }

        reply.clearCookie('refreshToken', { path: '/' })
        return reply.send({ message: 'Logged out' })
    }
}
