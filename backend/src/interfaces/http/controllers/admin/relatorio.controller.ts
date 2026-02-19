
import { FastifyReply, FastifyRequest } from 'fastify'
import { RelatorioService } from '../../../../application/services/relatorio.service'
import { PdfRelatorioService } from '../../../../application/services/pdf-relatorio.service'
import { prisma } from '../../../../infra/database/prisma.client'
import dayjs from 'dayjs'

const service = new RelatorioService()
const pdfService = new PdfRelatorioService()

export class RelatorioController {
    async getStats(request: FastifyRequest, reply: FastifyReply) {
        const { search, date, eventId } = request.query as { search?: string, date?: string, eventId?: string }
        const tenantId = (request as any).user.tenantId
        const stats = await service.getStats(tenantId, search, date, eventId)
        return reply.send(stats)
    }

    async exportCsv(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const csv = await service.exportCsv(tenantId)

        reply.header('Content-Type', 'text/csv')
        reply.header('Content-Disposition', 'attachment; filename="relatorio_presencas.csv"')
        return reply.send(csv)
    }

    async gerarPdf(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const { ensaioId } = request.params as { ensaioId: string }

        try {
            const ensaio = await prisma.ensaioRegional.findFirst({
                where: { id: ensaioId, tenantId }
            })
            const pdfBuffer = await pdfService.gerarPdf(ensaioId, tenantId)

            const localidade = ensaio?.nome || 'Regional'
            const data = ensaio?.dataEvento ? dayjs(ensaio.dataEvento).format('DD.MM.YY') : dayjs().format('DD.MM.YY')
            const filename = `Ensaio Local - ${localidade} - ${data}.pdf`

            reply.header('Content-Type', 'application/pdf')
            reply.header('Content-Disposition', `attachment; filename="${filename}"`)
            return reply.send(pdfBuffer)
        } catch (err: any) {
            if (err.message === 'Evento não encontrado') {
                return reply.status(404).send({ message: err.message })
            }
            throw err
        }
    }

    async gerarAnaliticoPdf(request: FastifyRequest, reply: FastifyReply) {
        const tenantId = (request as any).user.tenantId
        const { ensaioId } = request.params as { ensaioId: string }

        try {
            const pdfBuffer = await pdfService.gerarAnaliticoPdf(ensaioId, tenantId)
            const filename = `RELATORIO_ANALITICO_${dayjs().format('YYYYMMDD')}.pdf`

            reply.header('Content-Type', 'application/pdf')
            reply.header('Content-Disposition', `attachment; filename="${filename}"`)
            return reply.send(pdfBuffer)
        } catch (err: any) {
            if (err.message === 'Evento não encontrado') {
                return reply.status(404).send({ message: err.message })
            }
            throw err
        }
    }
}
