
import { FastifyInstance } from 'fastify'
import { PresencaController } from '../controllers/presenca.controller'
import { verifyJwt } from '../middlewares/verify-jwt'
import { roleGuard } from '../middlewares/role.guard'

const controller = new PresencaController()

export async function presencaRoutes(app: FastifyInstance) {
    app.addHook('preHandler', verifyJwt)
    // USER role required. ADMIN strictly speaking could also do it if they have 'USER' access or if we change roleGuard to allow >= USER.
    // Spec says "roleGuard(USER)".
    app.addHook('preHandler', roleGuard('USER'))

    app.get('/active-event', controller.getActiveEvent.bind(controller))
    app.post('/', controller.create.bind(controller))
    app.get('/cidades', controller.listCidades.bind(controller))
    app.get('/instrumentos', controller.listInstrumentos.bind(controller))
    app.get('/funcoes', controller.listFuncoes.bind(controller))
}
