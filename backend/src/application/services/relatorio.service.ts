
import { prisma } from '../../infra/database/prisma.client'
import { stringify } from 'csv-stringify/sync'

export class RelatorioService {
    async getStats(tenantId: string, search?: string, date?: string, eventId?: string) {
        const metricsWhere: any = { tenantId }
        if (eventId) {
            metricsWhere.ensaioRegionalId = eventId
        }

        // 1. Total Presences
        const totalPresencas = await prisma.registroPresenca.count({
            where: metricsWhere
        })

        // 2. Count Unique Cities (Cidades Atendidas)
        const uniqueCities = await prisma.cidade.groupBy({
            by: ['nomeCidade'],
            where: { tenantId, registros: { some: metricsWhere } }
        })
        const totalCidadesAtendidas = uniqueCities.length

        // 3. By Cidade Grouping
        const byCidadeRaw = await prisma.registroPresenca.groupBy({
            by: ['cidadeId'],
            _count: { userId: true },
            where: metricsWhere
        })

        const cidadeIds = byCidadeRaw.map(c => c.cidadeId)
        const cidades = await prisma.cidade.findMany({
            where: { id: { in: cidadeIds } },
            select: { id: true, nomeCidade: true, nomeBairro: true, nomeExibicao: true }
        })

        const cidadesMap = new Map(cidades.map(c => [c.id, c]))

        // Grouping logic for dashboard
        const cityGroups: Record<string, { nome: string, total: number, bairros: { nome: string, total: number }[] }> = {}

        byCidadeRaw.forEach(item => {
            const cid = cidadesMap.get(item.cidadeId)
            if (!cid) return

            const cityName = cid.nomeCidade || 'DESCONHECIDO'
            const bairroName = cid.nomeBairro || 'CENTRO'

            if (!cityGroups[cityName]) {
                cityGroups[cityName] = { nome: cityName, total: 0, bairros: [] }
            }

            const group = cityGroups[cityName]
            group.total += item._count.userId
            group.bairros.push({
                nome: bairroName,
                total: item._count.userId
            })
        })

        const statsCidade = Object.values(cityGroups).sort((a, b) => b.total - a.total)

        // 3. By Instrumento
        const byInstrumento = await prisma.registroPresenca.groupBy({
            by: ['instrumentoId'],
            _count: { userId: true },
            where: metricsWhere,
            orderBy: { _count: { userId: 'desc' } },
            take: 10
        })

        const instrumentoIds = byInstrumento.filter(i => i.instrumentoId !== null).map(i => i.instrumentoId as string)
        const instruments = await prisma.instrumento.findMany({
            where: { id: { in: instrumentoIds } },
            select: { id: true, nome: true }
        })
        const instMap = new Map(instruments.map(i => [i.id, i.nome]))

        const statsInstrumento = byInstrumento.map(item => ({
            nome: item.instrumentoId ? (instMap.get(item.instrumentoId) || 'Desconhecido') : 'Sem Instrumento',
            total: item._count.userId
        }))

        // 4. By Ensaio (Filtered)
        const where: any = {
            tenantId,
            deletedAt: null
        }

        if (search) {
            where.nome = { contains: search }
        }

        if (date) {
            const start = new Date(date)
            start.setHours(0, 0, 0, 0)
            const end = new Date(date)
            end.setHours(23, 59, 59, 999)

            where.dataHoraInicio = {
                gte: start,
                lte: end
            }
        }

        const ensaios = await prisma.ensaioRegional.findMany({
            where,
            select: {
                id: true,
                nome: true,
                dataHoraInicio: true,
                _count: {
                    select: { registros: true }
                }
            },
            orderBy: {
                dataHoraInicio: 'desc'
            }
        })

        const statsEnsaio = ensaios.map(e => ({
            id: e.id,
            nome: e.nome,
            data: e.dataHoraInicio,
            total: e._count.registros
        }))

        return {
            totalPresencas,
            totalCidadesAtendidas,
            byCidade: statsCidade,
            byInstrumento: statsInstrumento,
            byEvento: statsEnsaio
        }
    }

    async exportCsv(tenantId: string) {
        const registros = await prisma.registroPresenca.findMany({
            where: { tenantId },
            include: {
                cidade: true,
                instrumento: true,
                ensaioRegional: true,
                user: true // careful with PII? Name is fine.
            },
            orderBy: { createdAt: 'desc' }
        })

        const data = registros.map(r => ({
            Data: r.createdAt.toISOString().split('T')[0],
            Ensaio: r.ensaioRegional.nome,
            Nome: r.user.name || r.user.email,
            Funcao: r.funcaoMinisterio,
            Municipio: (r.cidade as any).nomeCidade || r.cidade.nome,
            Bairro: (r.cidade as any).nomeBairro || '-',
            CidadeExibicao: (r.cidade as any).nomeExibicao || r.cidade.nome,
            Instrumento: r.instrumento?.nome || r.instrumentoOutro || '-',
            PresencaConfirmada: 'Sim'
        }))

        return stringify(data, { header: true })
    }
}
