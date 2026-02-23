
import { EnsaioRegionalRepository } from '../../infra/repositories/ensaio-regional.repository'
import { AuditService } from './audit.service'

export class EnsaioRegionalService {
    private repository: EnsaioRegionalRepository

    constructor() {
        this.repository = new EnsaioRegionalRepository()
    }


    async create(data: { nome: string; dataEvento: string; dataHoraInicio: string; dataHoraFim: string; ativo?: boolean; anciaoAtendimento?: string; regionalRegente?: string; regionalRegente2?: string; regionalPrincipal?: string; regionalSecundario?: string; tipoResponsavelPrincipal?: string; tipoResponsavelSecundario?: string; localEvento?: string; cidadeEvento?: string; modoConvocacao?: boolean; regionalId?: string }, tenantId: string, userId: string, userRole?: string, userRegionalId?: string) {
        // Se for ADMIN_REGIONAL, força o regionalId dele
        const effectiveRegionalId = userRole === 'ADMIN_REGIONAL' ? userRegionalId : data.regionalId

        const nome = data.nome.trim().toUpperCase() // Normalize to Upper
        const dataEvento = new Date(data.dataEvento)

        const dataHoraInicio = new Date(data.dataHoraInicio)
        const dataHoraFim = new Date(data.dataHoraFim)

        if (isNaN(dataEvento.getTime()) || isNaN(dataHoraInicio.getTime()) || isNaN(dataHoraFim.getTime())) {
            throw new Error('Datas ou Horários inválidos')
        }

        if (dataHoraFim <= dataHoraInicio) {
            throw new Error('O horário de término deve ser após o horário de início')
        }

        if (data.regionalPrincipal && data.regionalSecundario && data.regionalPrincipal.trim().toUpperCase() === data.regionalSecundario.trim().toUpperCase()) {
            throw new Error('O Regional Secundário não pode ser igual ao Principal')
        }

        // Check duplicates
        const exists = await this.repository.findDuplicate(nome, dataEvento, tenantId)
        if (exists) {
            throw new Error('Evento Musical já existe nesta data')
        }

        const created = await this.repository.create({
            nome,
            dataEvento,
            dataHoraInicio,
            dataHoraFim,
            ativo: data.ativo ?? true,
            anciaoAtendimento: data.anciaoAtendimento?.trim().toUpperCase(),
            regionalRegente: data.regionalRegente?.trim().toUpperCase(),
            regionalRegente2: data.regionalRegente2?.trim().toUpperCase(),
            regionalPrincipal: data.regionalPrincipal?.trim().toUpperCase() || data.regionalRegente?.trim().toUpperCase(),
            regionalSecundario: data.regionalSecundario?.trim().toUpperCase() || data.regionalRegente2?.trim().toUpperCase(),
            tipoResponsavelPrincipal: data.tipoResponsavelPrincipal || 'REGIONAL',
            tipoResponsavelSecundario: data.tipoResponsavelSecundario || 'REGIONAL',
            dataInicio: dataHoraInicio,
            dataFim: dataHoraFim,
            localEvento: data.localEvento?.trim().toUpperCase(),
            cidadeEvento: data.cidadeEvento?.trim().toUpperCase(),
            modoConvocacao: data.modoConvocacao ?? false,
            regionalId: effectiveRegionalId
        }, tenantId)

        await AuditService.log({
            tenantId,
            userId,
            action: 'CREATE',
            entity: 'EnsaioRegional',
            entityId: created.id,
            details: `Nome: ${nome}`
        })

        return created
    }

    async list(tenantId: string, userRole?: string, userRegionalId?: string) {
        const regionalId = userRole === 'ADMIN_REGIONAL' ? userRegionalId : undefined
        return this.repository.list(tenantId, regionalId)
    }

    async findById(id: string, tenantId: string, userRole?: string, userRegionalId?: string) {
        const regionalId = userRole === 'ADMIN_REGIONAL' ? userRegionalId : undefined
        return this.repository.findById(id, tenantId, regionalId)
    }

    async update(id: string, data: { nome?: string; dataEvento?: string; dataHoraInicio?: string; dataHoraFim?: string; ativo?: boolean; anciaoAtendimento?: string; regionalRegente?: string; regionalRegente2?: string; regionalPrincipal?: string; regionalSecundario?: string; tipoResponsavelPrincipal?: string; tipoResponsavelSecundario?: string; localEvento?: string; cidadeEvento?: string; modoConvocacao?: boolean; regionalId?: string }, tenantId: string, userId: string, userRole?: string, userRegionalId?: string) {
        const regionalFilter = userRole === 'ADMIN_REGIONAL' ? userRegionalId : undefined
        const updateData: any = {}

        if (data.nome) updateData.nome = data.nome.trim().toUpperCase()
        if (data.ativo !== undefined) updateData.ativo = data.ativo
        if (data.dataEvento) {
            updateData.dataEvento = new Date(data.dataEvento)
            if (isNaN(updateData.dataEvento.getTime())) throw new Error('Invalid date')
        }
        if (data.dataHoraInicio) {
            updateData.dataHoraInicio = new Date(data.dataHoraInicio)
            if (isNaN(updateData.dataHoraInicio.getTime())) throw new Error('Data de início inválida')
        }
        if (data.dataHoraFim) {
            updateData.dataHoraFim = new Date(data.dataHoraFim)
            if (isNaN(updateData.dataHoraFim.getTime())) throw new Error('Data de término inválida')
        }
        if (data.anciaoAtendimento !== undefined) updateData.anciaoAtendimento = data.anciaoAtendimento.trim().toUpperCase()
        if (data.regionalRegente !== undefined) updateData.regionalRegente = data.regionalRegente.trim().toUpperCase()
        if (data.regionalRegente2 !== undefined) updateData.regionalRegente2 = data.regionalRegente2.trim().toUpperCase()
        if (data.regionalPrincipal !== undefined) updateData.regionalPrincipal = data.regionalPrincipal.trim().toUpperCase()
        if (data.regionalSecundario !== undefined) updateData.regionalSecundario = data.regionalSecundario.trim().toUpperCase()
        if (data.tipoResponsavelPrincipal !== undefined) updateData.tipoResponsavelPrincipal = data.tipoResponsavelPrincipal
        if (data.tipoResponsavelSecundario !== undefined) updateData.tipoResponsavelSecundario = data.tipoResponsavelSecundario
        if (updateData.dataHoraInicio) updateData.dataInicio = updateData.dataHoraInicio
        if (updateData.dataHoraFim) updateData.dataFim = updateData.dataHoraFim
        if (data.localEvento !== undefined) updateData.localEvento = data.localEvento.trim().toUpperCase()
        if (data.cidadeEvento !== undefined) updateData.cidadeEvento = data.cidadeEvento.trim().toUpperCase()
        if (data.modoConvocacao !== undefined) updateData.modoConvocacao = data.modoConvocacao

        // Superadmin can update regionalId
        if (userRole === 'SUPERADMIN' && data.regionalId) {
            updateData.regionalId = data.regionalId
        }


        if (updateData.nome || updateData.dataEvento) {
            const current = await this.findById(id, tenantId, userRole, userRegionalId)
            if (!current) throw new Error('Not found')

            const checkName = updateData.nome || current.nome
            const checkDate = updateData.dataEvento || current.dataEvento

            const duplicate = await this.repository.findDuplicate(checkName, checkDate, tenantId, id, regionalFilter)
            if (duplicate) throw new Error('Ensaio already exists with this name and date')
        }

        const current = await this.findById(id, tenantId, userRole, userRegionalId)
        if (!current) throw new Error('Not found')

        const r1 = (data.regionalPrincipal !== undefined ? data.regionalPrincipal : (current as any).regionalPrincipal)?.trim().toUpperCase()
        const r2 = (data.regionalSecundario !== undefined ? data.regionalSecundario : (current as any).regionalSecundario)?.trim().toUpperCase()

        if (r1 && r2 && r1 === r2) {
            throw new Error('O Regional Secundário não pode ser igual ao Principal')
        }

        const result = await this.repository.update(id, updateData, tenantId, regionalFilter)
        if (!result) throw new Error('Not found')

        await AuditService.log({
            tenantId,
            userId,
            action: 'UPDATE',
            entity: 'EnsaioRegional',
            entityId: id,
            details: JSON.stringify(data)
        })

        return result
    }

    async delete(id: string, tenantId: string, userId: string, userRole?: string, userRegionalId?: string) {
        const regionalId = userRole === 'ADMIN_REGIONAL' ? userRegionalId : undefined
        const result = await this.repository.softDelete(id, tenantId, regionalId)
        if (!result) throw new Error('Not found')

        await AuditService.log({
            tenantId,
            userId,
            action: 'DELETE',
            entity: 'EnsaioRegional',
            entityId: id
        })

        return result
    }

    async linkUser(userId: string, ensaioId: string, tenantId: string, userRole?: string, userRegionalId?: string) {
        const regionalId = userRole === 'ADMIN_REGIONAL' ? userRegionalId : undefined
        return this.repository.linkUser(userId, ensaioId, tenantId, regionalId)
    }

    async summonUsers(ensaioId: string, userIds: string[], tenantId: string, adminUserId: string, userRole?: string, userRegionalId?: string) {
        // 1. Check event exists and belongs to tenant (and to admin's regional when ADMIN_REGIONAL)
        const regionalId = userRole === 'ADMIN_REGIONAL' ? userRegionalId : undefined
        const ensaio = await this.repository.findById(ensaioId, tenantId, regionalId)
        if (!ensaio) throw new Error('Evento não encontrado')

        // 2. Perform summoning in repository
        await this.repository.summonUsers(ensaioId, userIds, tenantId)

        // 3. Log
        await AuditService.log({
            tenantId,
            userId: adminUserId,
            action: 'SUMMON',
            entity: 'EnsaioRegional',
            entityId: ensaioId,
            details: `Usuários convocados: ${userIds.length}`
        })

        return { success: true }
    }
}
