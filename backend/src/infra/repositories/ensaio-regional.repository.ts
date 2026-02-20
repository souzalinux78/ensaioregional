
import { prisma } from '../database/prisma.client'

export class EnsaioRegionalRepository {
    async create(data: { nome: string; dataEvento: Date; dataHoraInicio: Date; dataHoraFim: Date; ativo: boolean; anciaoAtendimento?: string; regionalRegente?: string; regionalRegente2?: string; regionalPrincipal?: string; regionalSecundario?: string; tipoResponsavelPrincipal?: string; tipoResponsavelSecundario?: string; dataInicio?: Date; dataFim?: Date; localEvento?: string; cidadeEvento?: string; modoConvocacao?: boolean; regionalId?: string }, tenantId: string) {
        return prisma.ensaioRegional.create({
            data: {
                nome: data.nome,
                dataEvento: data.dataEvento,
                dataHoraInicio: data.dataHoraInicio,
                dataHoraFim: data.dataHoraFim,
                ativo: data.ativo,
                anciaoAtendimento: data.anciaoAtendimento,
                regionalRegente: data.regionalRegente,
                regionalRegente2: data.regionalRegente2,
                regionalPrincipal: data.regionalPrincipal,
                regionalSecundario: data.regionalSecundario,
                tipoResponsavelPrincipal: (data as any).tipoResponsavelPrincipal || 'REGIONAL',
                tipoResponsavelSecundario: (data as any).tipoResponsavelSecundario || 'REGIONAL',
                dataInicio: data.dataInicio,
                dataFim: data.dataFim,
                localEvento: data.localEvento,
                cidadeEvento: data.cidadeEvento,
                modoConvocacao: data.modoConvocacao ?? false,
                tenantId,
                regionalId: data.regionalId
            },
        })
    }

    async findById(id: string, tenantId: string, regionalId?: string) {
        return prisma.ensaioRegional.findFirst({
            where: {
                id,
                tenantId,
                regionalId,
                deletedAt: null,
            },
            include: {
                _count: { select: { users: true } },
                regional: true
            }
        })
    }

    async findDuplicate(nome: string, dataEvento: Date, tenantId: string, excludeId?: string, regionalId?: string) {
        return prisma.ensaioRegional.findFirst({
            where: {
                tenantId,
                nome,
                dataEvento,
                regionalId,
                deletedAt: null,
                id: excludeId ? { not: excludeId } : undefined
            }
        })
    }

    async list(tenantId: string, regionalId?: string) {
        return prisma.ensaioRegional.findMany({
            where: {
                tenantId,
                regionalId,
                deletedAt: null,
            },
            include: {
                regional: true
            },
            orderBy: {
                dataEvento: 'desc',
            },
        })
    }

    async update(id: string, data: Partial<{ nome: string; dataEvento: Date; dataHoraInicio: Date; dataHoraFim: Date; ativo: boolean; anciaoAtendimento: string; regionalRegente: string; regionalRegente2: string; regionalPrincipal: string; regionalSecundario: string; tipoResponsavelPrincipal: string; tipoResponsavelSecundario: string; dataInicio: Date; dataFim: Date; localEvento: string; cidadeEvento: string; modoConvocacao: boolean; regionalId: string }>, tenantId: string, regionalId?: string) {
        // Ensure existence and ownership
        const exists = await this.findById(id, tenantId, regionalId)
        if (!exists) return null

        return prisma.ensaioRegional.update({
            where: { id },
            data
        })
    }

    async softDelete(id: string, tenantId: string, regionalId?: string) {
        const exists = await this.findById(id, tenantId, regionalId)
        if (!exists) return null

        return prisma.ensaioRegional.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        })
    }

    // Summon users to event
    async summonUsers(ensaioId: string, userIds: string[], tenantId: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Remove all summons for this event in this tenant (to refresh)
            await tx.eventoUsuario.deleteMany({
                where: {
                    ensaioRegionalId: ensaioId,
                    tenantId
                }
            })

            // 2. Create new summons
            if (userIds.length > 0) {
                await tx.eventoUsuario.createMany({
                    data: userIds.map(userId => ({
                        ensaioRegionalId: ensaioId,
                        userId,
                        tenantId,
                        convocado: true
                    }))
                })

                // 3. Update User.ensaioRegionalId for compatibility (or we can transition away from this)
                // For now, let's keep it as the 'active' link for users.
                await tx.user.updateMany({
                    where: { id: { in: userIds }, tenantId },
                    data: { ensaioRegionalId: ensaioId }
                })

                // Also clear for users NOT summoned IF they were linked to this one
                await tx.user.updateMany({
                    where: {
                        tenantId,
                        ensaioRegionalId: ensaioId,
                        id: { notIn: userIds }
                    },
                    data: { ensaioRegionalId: null }
                })
            } else {
                // Clear for everyone linked to this ensaio
                await tx.user.updateMany({
                    where: {
                        tenantId,
                        ensaioRegionalId: ensaioId
                    },
                    data: { ensaioRegionalId: null }
                })
            }
        })
    }

    // Helper for user linking (Legacy/Individual)
    async linkUser(userId: string, ensaioId: string, tenantId: string) {
        // Verify both belong to tenant
        const user = await prisma.user.findFirst({ where: { id: userId, tenantId } })
        if (!user) throw new Error('User not found')

        const ensaio = await this.findById(ensaioId, tenantId)
        if (!ensaio) throw new Error('Ensaio not found')

        return prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { ensaioRegionalId: ensaioId }
            }),
            prisma.eventoUsuario.upsert({
                where: { ensaioRegionalId_userId: { ensaioRegionalId: ensaioId, userId } },
                create: { ensaioRegionalId: ensaioId, userId, tenantId, convocado: true },
                update: { convocado: true }
            })
        ])
    }
}
