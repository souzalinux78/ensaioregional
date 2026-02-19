
import { FastifyInstance } from 'fastify'
import { AuthController } from '../controllers/auth.controller'

const authController = new AuthController()

export async function authRoutes(app: FastifyInstance) {
    app.post('/login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, authController.login.bind(authController))

    app.post('/refresh', authController.refresh.bind(authController))
    app.post('/logout', authController.logout.bind(authController))
}
