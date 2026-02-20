
import { FastifyInstance } from 'fastify'
import { AdminEnsaioController } from '../controllers/admin/ensaio.controller'
import { AdminCidadeController } from '../controllers/admin/cidade.controller'
import { AdminInstrumentoController } from '../controllers/admin/instrumento.controller'
import { RelatorioController } from '../controllers/admin/relatorio.controller'
import { AdminFuncaoController } from '../controllers/admin/funcao.controller'
import { RegionalController } from '../controllers/admin/regional.controller'
import { verifyJwt } from '../middlewares/verify-jwt'
import { roleGuard } from '../middlewares/role.guard'

const ensaioController = new AdminEnsaioController()
const cidadeController = new AdminCidadeController()
const instrumentoController = new AdminInstrumentoController()
const funcaoController = new AdminFuncaoController()
const regionalController = new RegionalController()

export async function adminRoutes(app: FastifyInstance) {
    app.addHook('preHandler', verifyJwt)
    app.addHook('preHandler', roleGuard('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN'))

    // Ensaios
    app.post('/ensaios', ensaioController.create.bind(ensaioController))
    app.get('/ensaios', ensaioController.list.bind(ensaioController))
    app.get('/ensaios/:id', ensaioController.get.bind(ensaioController))
    app.patch('/ensaios/:id', ensaioController.update.bind(ensaioController))
    app.delete('/ensaios/:id', ensaioController.delete.bind(ensaioController))
    app.post('/ensaios/:id/summon', ensaioController.summon.bind(ensaioController))
    // Cidades
    app.post('/cidades', cidadeController.create.bind(cidadeController))
    app.get('/cidades', cidadeController.list.bind(cidadeController))
    app.patch('/cidades/:id', cidadeController.update.bind(cidadeController))
    app.delete('/cidades/:id', cidadeController.delete.bind(cidadeController))
    app.post('/cidades/import', cidadeController.import.bind(cidadeController))

    // Instrumentos
    app.post('/instrumentos', instrumentoController.create.bind(instrumentoController))
    app.get('/instrumentos', instrumentoController.list.bind(instrumentoController))
    app.patch('/instrumentos/:id', instrumentoController.update.bind(instrumentoController))
    app.delete('/instrumentos/:id', instrumentoController.delete.bind(instrumentoController))
    app.post('/instrumentos/import', instrumentoController.import.bind(instrumentoController))

    // Funções Ministério
    app.get('/funcoes', funcaoController.list.bind(funcaoController))
    app.post('/funcoes', funcaoController.create.bind(funcaoController))
    app.delete('/funcoes/:id', funcaoController.delete.bind(funcaoController))

    // Relatorios
    const relatorioController = new RelatorioController()
    app.get('/relatorios/stats', relatorioController.getStats.bind(relatorioController))
    app.get('/relatorios/export', relatorioController.exportCsv.bind(relatorioController))
    app.get('/relatorios/:ensaioId/pdf', relatorioController.gerarPdf.bind(relatorioController))
    app.get('/relatorios/:ensaioId/analitico/pdf', relatorioController.gerarAnaliticoPdf.bind(relatorioController))

    // Regionais
    app.get('/regionais', regionalController.list.bind(regionalController))
    app.post('/regionais', { preHandler: roleGuard('SUPERADMIN', 'ADMIN') }, regionalController.create.bind(regionalController))
    app.patch('/regionais/:id', { preHandler: roleGuard('SUPERADMIN', 'ADMIN') }, regionalController.update.bind(regionalController))
    app.delete('/regionais/:id', { preHandler: roleGuard('SUPERADMIN', 'ADMIN') }, regionalController.delete.bind(regionalController))
}
