
import { prisma } from '../../infra/database/prisma.client'
import { stringify } from 'csv-stringify/sync'

export class RelatorioService {
    async getStats(tenantId: string, search?: string, date?: string, eventId?: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        const ids = Array.isArray(userRegionalIds) && userRegionalIds.length > 0 ? userRegionalIds : (userRegionalId ? [userRegionalId] : [])
        // Sempre excluir eventos soft-deleted das métricas e listas
        const metricsWhere: any = {
            tenantId,
            ensaioRegional: { deletedAt: null }
        }
        if (userRole === 'ADMIN_REGIONAL' && ids.length > 0) {
            metricsWhere.ensaioRegional = { deletedAt: null, regionalId: ids.length === 1 ? ids[0] : { in: ids } }
        }

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

        if (userRole === 'ADMIN_REGIONAL' && ids.length > 0) {
            where.regionalId = ids.length === 1 ? ids[0] : { in: ids }
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

    async exportCsv(tenantId: string, userRole?: string, userRegionalId?: string, userRegionalIds?: string[]) {
        const where: any = { tenantId }
        const ids = Array.isArray(userRegionalIds) && userRegionalIds.length > 0 ? userRegionalIds : (userRegionalId ? [userRegionalId] : [])
        if (userRole === 'ADMIN_REGIONAL' && ids.length > 0) {
            where.ensaioRegional = { regionalId: ids.length === 1 ? ids[0] : { in: ids } }
        }

        const registros = await prisma.registroPresenca.findMany({
            where,
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
    async getExecutiveStats(tenantId: string) {
        const [totalRegionais, totalEventos, totalPresencas, totalUsuarios] = await Promise.all([
            prisma.regional.count({ where: { tenantId } }),
            prisma.ensaioRegional.count({ where: { tenantId, deletedAt: null } }),
            prisma.registroPresenca.count({ where: { tenantId } }),
            prisma.user.count({ where: { tenantId, deletedAt: null } })
        ])

        const regionaisData = await prisma.regional.findMany({
            where: { tenantId },
            select: {
                nome: true,
                _count: {
                    select: { ensaiosRegionais: true }
                },
                ensaiosRegionais: {
                    where: { deletedAt: null },
                    select: {
                        _count: {
                            select: { registros: true }
                        }
                    }
                }
            }
        })

        const presencasPorRegional = regionaisData.map(r => ({
            nome: r.nome,
            total: r.ensaiosRegionais.reduce((acc, curr) => acc + curr._count.registros, 0)
        }))

        const eventosPorRegional = regionaisData.map(r => ({
            nome: r.nome,
            total: r._count.ensaiosRegionais
        }))

        const rankingRegionais = [...presencasPorRegional].sort((a, b) => b.total - a.total)

        // Monthly Evolution (Last 12 months)
        // Grouping in JS for maximum compatibility between DB providers (MySQL/SQLite/PG)
        const presencasDatas = await prisma.registroPresenca.findMany({
            where: { tenantId },
            select: { createdAt: true }
        })

        const evolucaoMap: Record<string, number> = {}
        presencasDatas.forEach(p => {
            const mes = p.createdAt.toISOString().substring(0, 7) // YYYY-MM
            evolucaoMap[mes] = (evolucaoMap[mes] || 0) + 1
        })

        const evolucaoMensal = Object.entries(evolucaoMap)
            .map(([mes, total]) => ({ mes, total }))
            .sort((a, b) => a.mes.localeCompare(b.mes))
            .slice(-12)

        return {
            totalRegionais,
            totalEventos,
            totalPresencas,
            totalUsuarios,
            presencasPorRegional,
            eventosPorRegional,
            rankingRegionais,
            evolucaoMensal
        }
    }

    async getBIStats(tenantId: string) {
        const now = new Date()
        const mesAtual = now.getMonth() + 1
        const anoAtual = now.getFullYear()

        const mesAnteriorDate = new Date()
        mesAnteriorDate.setMonth(now.getMonth() - 1)
        const mesAnterior = mesAnteriorDate.getMonth() + 1
        const anoAnterior = mesAnteriorDate.getFullYear()

        // 1. Fetch Goals
        const metas = await prisma.metaRegional.findMany({
            where: { tenantId, ano: anoAtual, mes: mesAtual },
            include: { regional: true }
        })

        // 2. Mes Atual Stats
        const startMesAtual = new Date(anoAtual, mesAtual - 1, 1)
        const endMesAtual = new Date(anoAtual, mesAtual, 0, 23, 59, 59, 999)

        const [statsMesAtual, statsMesAnterior] = await Promise.all([
            prisma.registroPresenca.findMany({
                where: { tenantId, createdAt: { gte: startMesAtual, lte: endMesAtual } },
                include: { ensaioRegional: true }
            }),
            prisma.registroPresenca.findMany({
                where: {
                    tenantId,
                    createdAt: {
                        gte: new Date(anoAnterior, mesAnterior - 1, 1),
                        lte: new Date(anoAnterior, mesAnterior, 0, 23, 59, 59, 999)
                    }
                },
                include: { ensaioRegional: true }
            })
        ])

        // Group by Regional
        const groupByRegional = (data: any[]) => {
            const counts: Record<string, number> = {}
            data.forEach(p => {
                const regId = p.ensaioRegional.regionalId || 'default'
                counts[regId] = (counts[regId] || 0) + 1
            })
            return counts
        }

        const countsMesAtual = groupByRegional(statsMesAtual)
        const countsMesAnterior = groupByRegional(statsMesAnterior)

        const regionais = await prisma.regional.findMany({ where: { tenantId } })

        const comparativoMensal = regionais.map(r => {
            const atual = countsMesAtual[r.id] || 0
            const anterior = countsMesAnterior[r.id] || 0
            let crescimento = 0
            if (anterior > 0) {
                crescimento = ((atual - anterior) / anterior) * 100
            } else if (atual > 0) {
                crescimento = 100
            }

            return {
                regional: r.nome,
                regionalId: r.id,
                mesAtual: atual,
                mesAnterior: anterior,
                crescimento: parseFloat(crescimento.toFixed(1))
            }
        })

        const metasVsRealizado = regionais.map(r => {
            const meta = metas.find((m: any) => m.regionalId === r.id)
            const realizado = countsMesAtual[r.id] || 0
            const metaPresencas = meta?.metaPresencasMensal || 0

            return {
                regional: r.nome,
                realizado,
                meta: metaPresencas,
                percentual: metaPresencas > 0 ? parseFloat(((realizado / metaPresencas) * 100).toFixed(1)) : 0
            }
        })

        const rankingPerformance = [...metasVsRealizado]
            .sort((a, b) => b.percentual - a.percentual)

        const totalPresencasMesAtual = statsMesAtual.length
        const totalPresencasMesAnterior = statsMesAnterior.length
        let crescimentoGlobal = 0
        if (totalPresencasMesAnterior > 0) {
            crescimentoGlobal = ((totalPresencasMesAtual - totalPresencasMesAnterior) / totalPresencasMesAnterior) * 100
        } else if (totalPresencasMesAtual > 0) {
            crescimentoGlobal = 100
        }

        return {
            resumoGeral: {
                totalPresencas: totalPresencasMesAtual,
                crescimentoGlobal: parseFloat(crescimentoGlobal.toFixed(1)),
                metaGlobal: metas.reduce((acc: number, curr: any) => acc + curr.metaPresencasMensal, 0)
            },
            comparativoMensal,
            metasVsRealizado,
            rankingPerformance
        }
    }
}
