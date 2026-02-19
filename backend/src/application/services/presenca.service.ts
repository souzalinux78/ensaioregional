
import { prisma } from '../../infra/database/prisma.client'
// import { CidadeService } from './cidade.service'
// import { InstrumentoService } from './instrumento.service'
import { normalizeString, normalizeInstrumentName } from '../../shared/utils/normalization'

export class PresencaService {
    // private cidadeService: CidadeService
    // private instrumentoService: InstrumentoService

    constructor() {
        // this.cidadeService = new CidadeService()
        // this.instrumentoService = new InstrumentoService()
    }

    private normalize(text: string) {
        return normalizeString(text)
    }

    async create(data: {
        userId: string
        tenantId: string
        funcaoMinisterio: string
        cidadeId?: string
        cidadeNome?: string
        instrumentoId?: string
        instrumentoNome?: string
    }) {
        const { userId, tenantId, funcaoMinisterio } = data

        return await prisma.$transaction(async (tx) => {
            const now = new Date()

            // 1. Resolve which event (Ensaio)
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { ensaioRegionalId: true, tenantId: true }
            })

            let ensaioId = user?.ensaioRegionalId

            if (!ensaioId) {
                // Find current active event for the tenant
                const activeEnsaio = await (tx.ensaioRegional as any).findFirst({
                    where: {
                        tenantId,
                        ativo: true,
                        deletedAt: null,
                        dataInicio: { lte: now },
                        dataFim: { gte: now }
                    },
                    orderBy: { dataInicio: 'desc' }
                })

                if (!activeEnsaio) {
                    throw new Error('Nenhum evento ativo encontrado para registro no momento.')
                }
                ensaioId = activeEnsaio.id
            }

            const ensaio = await (tx.ensaioRegional as any).findFirst({
                where: {
                    id: ensaioId,
                    tenantId,
                }
            })

            if (!ensaio) {
                throw new Error('Evento Musical não encontrado.')
            }

            if (ensaio.deletedAt) throw new Error('Evento Musical foi removido.')
            if (!ensaio.ativo) throw new Error('Evento Musical está inativo.')

            // 2. Time-window validation
            if (!ensaio.dataInicio || !ensaio.dataFim) {
                // Fallback to legacy fields if new ones are empty
                if (!ensaio.dataHoraInicio || !ensaio.dataHoraFim) {
                    throw new Error('Configuração de horário do evento inválida.')
                }
            }

            const regStart = ensaio.dataInicio || ensaio.dataHoraInicio
            const regEnd = ensaio.dataFim || ensaio.dataHoraFim

            if (now < regStart) {
                throw new Error(`O registro de presença ainda não foi aberto. Inicia em ${new Date(regStart).toLocaleString('pt-BR')}.`)
            }
            if (now > regEnd) {
                throw new Error('O período de registro para este evento já foi encerrado.')
            }

            // 3. Verify summoning (convocação) ONLY if modoConvocacao is enabled
            if (ensaio.modoConvocacao) {
                const convocacao = await tx.eventoUsuario.findUnique({
                    where: {
                        ensaioRegionalId_userId: {
                            ensaioRegionalId: ensaio.id,
                            userId
                        }
                    }
                })

                if (!convocacao || !convocacao.convocado) {
                    throw new Error('Este evento exige convocação prévia e seu registro não foi localizado.')
                }
            }

            // 2. Resolve Cidade
            let cidadeId = data.cidadeId

            if (!cidadeId && data.cidadeNome) {
                // Use Service logic but we need transaction context?
                // CidadeService uses repository which uses global prisma.
                // ideally we pass tx to repository methods.
                // For now, let's duplicate logic or assume slight race condition risk is acceptable inside this transaction OR
                // Ideally, we implement 'findOrCreate' directly here with tx.

                const nomeCidade = this.normalize(data.cidadeNome)
                const existingCidade = await tx.cidade.findUnique({
                    where: { tenantId_nome: { tenantId, nome: nomeCidade } }
                })

                if (existingCidade) {
                    if (existingCidade.deletedAt) {
                        // Restore logic inside TX
                        await tx.cidade.update({ where: { id: existingCidade.id }, data: { deletedAt: null } })
                    }
                    cidadeId = existingCidade.id
                } else {
                    const newCidade = await tx.cidade.create({
                        data: { nome: nomeCidade, tenantId }
                    })
                    cidadeId = newCidade.id
                }
            }

            if (!cidadeId) {
                throw new Error('Cidade is required (ID or Name)')
            }

            // Validate Cidade Tenant Exists
            if (data.cidadeId) {
                const checkCidade = await tx.cidade.findFirst({
                    where: { id: cidadeId, tenantId, deletedAt: null }
                })
                if (!checkCidade) throw new Error('Cidade selecionada inválida.')
            }

            // 3. Resolve Instrumento
            let instrumentoId: string | null = null
            let instrumentoOutro: string | null = null

            if (data.instrumentoId) {
                const checkInst = await tx.instrumento.findFirst({
                    where: { id: data.instrumentoId, tenantId, deletedAt: null }
                })
                if (!checkInst) throw new Error('Instrumento selecionado inválido.')
                instrumentoId = data.instrumentoId
            } else if (data.instrumentoNome) {
                // findOrCreate: typed instrument becomes a permanent record
                const nomeInst = normalizeInstrumentName(data.instrumentoNome)
                const existingInst = await tx.instrumento.findUnique({
                    where: { tenantId_nome: { tenantId, nome: nomeInst } }
                })

                if (existingInst) {
                    if (existingInst.deletedAt) {
                        await tx.instrumento.update({ where: { id: existingInst.id }, data: { deletedAt: null } })
                    }
                    instrumentoId = existingInst.id
                } else {
                    const newInst = await tx.instrumento.create({
                        data: { nome: nomeInst, tenantId }
                    })
                    instrumentoId = newInst.id
                }
                instrumentoOutro = null
            }

            // 4. Create Registro
            const registro = await tx.registroPresenca.create({
                data: {
                    tenantId,
                    userId,
                    ensaioRegionalId: ensaio.id,
                    funcaoMinisterio: this.normalize(funcaoMinisterio),
                    cidadeId,
                    instrumentoId,
                    instrumentoOutro
                }
            })

            return { message: 'Presença registrada com sucesso', id: registro.id }
        })
    }

    async listCidades(tenantId: string) {
        return prisma.cidade.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { nome: 'asc' }
        })
    }

    async listInstrumentos(tenantId: string) {
        return prisma.instrumento.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { nome: 'asc' }
        })
    }

    async listFuncoes(tenantId: string) {
        return prisma.funcaoMinisterio.findMany({
            where: { tenantId, deletedAt: null },
            orderBy: { nome: 'asc' },
            select: { id: true, nome: true }
        })
    }

    async getActiveEvent(tenantId: string, userId: string) {
        const now = new Date()

        // 1. Check if user has a linked event
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { ensaioRegionalId: true }
        })

        let ensaio: any = null

        if (user?.ensaioRegionalId) {
            ensaio = await prisma.ensaioRegional.findFirst({
                where: { id: user.ensaioRegionalId, tenantId, deletedAt: null }
            })
        }

        // 2. If no linked event or it's not active/within window, find ANY active event for tenant
        const isWithinWindow = (e: any) => {
            const start = e.dataInicio || e.dataHoraInicio
            const end = e.dataFim || e.dataHoraFim
            return now >= start && now <= end
        }

        if (!ensaio || !ensaio.ativo || !isWithinWindow(ensaio)) {
            const active = await (prisma.ensaioRegional as any).findFirst({
                where: {
                    tenantId,
                    ativo: true,
                    deletedAt: null,
                    OR: [
                        {
                            dataInicio: { lte: now },
                            dataFim: { gte: now }
                        },
                        {
                            // Legacy support
                            dataHoraInicio: { lte: now },
                            dataHoraFim: { gte: now }
                        }
                    ]
                },
                orderBy: { dataInicio: 'desc' }
            })
            if (active) ensaio = active
        }

        if (!ensaio) return null

        return {
            id: ensaio.id,
            nome: ensaio.nome,
            dataEvento: ensaio.dataEvento,
            dataHoraInicio: ensaio.dataInicio || ensaio.dataHoraInicio,
            dataHoraFim: ensaio.dataFim || ensaio.dataHoraFim,
            localEvento: ensaio.localEvento,
            modoConvocacao: ensaio.modoConvocacao
        }
    }
}
