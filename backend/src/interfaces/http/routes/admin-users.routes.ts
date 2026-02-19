
import { FastifyInstance } from 'fastify'
import { AdminUserController } from '../controllers/admin/user.controller'
import { verifyJwt } from '../middlewares/verify-jwt'
import { roleGuard } from '../middlewares/role.guard'

const userController = new AdminUserController()

export async function adminUsersRoutes(app: FastifyInstance) {
    app.addHook('preHandler', verifyJwt)
    app.addHook('preHandler', roleGuard('ADMIN'))

    app.get('/', userController.list.bind(userController))
    app.post('/', userController.create.bind(userController))
    app.get('/:id', userController.get.bind(userController))
    app.patch('/:id', userController.update.bind(userController))
    app.delete('/:id', userController.delete.bind(userController))
    app.patch('/:id/evento', userController.assignEvento.bind(userController))
}
