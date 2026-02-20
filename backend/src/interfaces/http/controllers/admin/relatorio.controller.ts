
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
        const { tenantId, role, regionalId } = (request as any).user
        const stats = await service.getStats(tenantId, search, date, eventId, role, regionalId)
        return reply.send(stats)
    }

    async getExecutiveStats(request: FastifyRequest, reply: FastifyReply) {
        const { tenantId, role } = (request as any).user
        if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
            return reply.status(403).send({ message: 'Acesso restrito a SuperAdmin' })
        }
        const stats = await service.getExecutiveStats(tenantId)
        return reply.send(stats)
    }

    async getBIStats(request: FastifyRequest, reply: FastifyReply) {
        const { tenantId, role } = (request as any).user
        if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
            return reply.status(403).send({ message: 'Acesso restrito a SuperAdmin' })
        }
        const stats = await service.getBIStats(tenantId)
        return reply.send(stats)
    }

    async gerarBIPdf(request: FastifyRequest, reply: FastifyReply) {
        const { tenantId, role } = (request as any).user
        if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
            return reply.status(403).send({ message: 'Acesso restrito' })
        }

        const { stats, chartImages, regionalNome } = request.body as any
        const pdf = await pdfService.gerarBIPdf(stats, chartImages, regionalNome)

        return reply
            .type('application/pdf')
            .header('Content-Disposition', 'attachment; filename=relatorio_bi_executivo.pdf')
            .send(pdf)
    }

    async exportCsv(request: FastifyRequest, reply: FastifyReply) {
        const { tenantId, role, regionalId } = (request as any).user
        const csv = await service.exportCsv(tenantId, role, regionalId)

        reply.header('Content-Type', 'text/csv')
        reply.header('Content-Disposition', 'attachment; filename="relatorio_presencas.csv"')
        return reply.send(csv)
    }

    async gerarPdf(request: FastifyRequest, reply: FastifyReply) {
        const { tenantId, role, regionalId } = (request as any).user
        const { ensaioId } = request.params as { ensaioId: string }

        try {
            const where: any = { id: ensaioId, tenantId }
            if (role === 'ADMIN_REGIONAL') {
                where.regionalId = regionalId
            }

            const ensaio = await prisma.ensaioRegional.findFirst({
                where
            })

            if (!ensaio) {
                return reply.status(404).send({ message: 'Evento não encontrado ou acesso negado' })
            }
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
        const { tenantId, role, regionalId } = (request as any).user
        const { ensaioId } = request.params as { ensaioId: string }

        try {
            const where: any = { id: ensaioId, tenantId }
            if (role === 'ADMIN_REGIONAL') {
                where.regionalId = regionalId
            }

            const ensaio = await prisma.ensaioRegional.findFirst({
                where
            })

            if (!ensaio) {
                return reply.status(404).send({ message: 'Evento não encontrado ou acesso negado' })
            }

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
