
import { api } from '../context/AuthContext'

export interface Evento {
    id: string
    nome: string
    dataEvento: string
    ativo: boolean
    anciaoAtendimento?: string
    regionalRegente?: string
    regionalRegente2?: string
    regionalPrincipal?: string
    regionalSecundario?: string
    tipoResponsavelPrincipal?: string
    tipoResponsavelSecundario?: string
    dataHoraInicio: string
    dataHoraFim: string
    localEvento?: string
    cidadeEvento?: string
    modoConvocacao?: boolean
    _count?: { registros: number; users: number }
}

export interface Cidade {
    id: string
    nome: string
    nomeCidade?: string
    nomeBairro?: string
    nomeExibicao?: string
}

export interface Instrumento {
    id: string
    nome: string
}

export interface User {
    id: string
    name: string
    email: string
    role: string
    ensaioRegionalId?: string
    regionalId?: string
    ensaioRegional?: { nome: string; dataEvento: string }
    regional?: { nome: string }
}

export interface Regional {
    id: string
    nome: string
    setor?: string
    ativo: boolean
}

export interface Stats {
    totalPresencas: number
    totalCidadesAtendidas: number
    byCidade: {
        nome: string,
        total: number,
        bairros: { nome: string, total: number }[]
    }[]
    byInstrumento: { nome: string, total: number }[]
    byEvento: { id: string, nome: string, data: string, total: number }[]
}

export interface ExecutiveStats {
    totalRegionais: number
    totalEventos: number
    totalPresencas: number
    totalUsuarios: number
    presencasPorRegional: { nome: string, total: number }[]
    eventosPorRegional: { nome: string, total: number }[]
    rankingRegionais: { nome: string, total: number }[]
    evolucaoMensal: { mes: string, total: number }[]
}

export interface BIStats {
    resumoGeral: {
        totalPresencas: number
        crescimentoGlobal: number
        metaGlobal: number
    }
    comparativoMensal: {
        regional: string
        regionalId: string
        mesAtual: number
        mesAnterior: number
        crescimento: number
    }[]
    metasVsRealizado: {
        regional: string
        realizado: number
        meta: number
        percentual: number
    }[]
    rankingPerformance: {
        regional: string
        realizado: number
        meta: number
        percentual: number
    }[]
}

export const AdminService = {
    // Eventos Musicais CCB
    getEventos: () => api.get<Evento[]>('/admin/ensaios'),
    createEvento: (data: Partial<Evento>) => api.post('/admin/ensaios', data),
    updateEvento: (id: string, data: Partial<Evento>) => api.patch(`/admin/ensaios/${id}`, data),
    deleteEvento: (id: string) => api.delete(`/admin/ensaios/${id}`),

    // Cidades
    getCidades: () => api.get<Cidade[]>('/admin/cidades'),
    createCidade: (data: { nomeCidade: string, nomeBairro?: string }) => api.post('/admin/cidades', data),
    updateCidade: (id: string, data: { nomeCidade: string, nomeBairro?: string }) => api.patch(`/admin/cidades/${id}`, data),
    deleteCidade: (id: string) => api.delete(`/admin/cidades/${id}`),
    importCidades: (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/admin/cidades/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Instrumentos
    getInstrumentos: () => api.get<Instrumento[]>('/admin/instrumentos'),
    createInstrumento: (nome: string) => api.post('/admin/instrumentos', { nome }),
    updateInstrumento: (id: string, nome: string) => api.patch(`/admin/instrumentos/${id}`, { nome }),
    deleteInstrumento: (id: string) => api.delete(`/admin/instrumentos/${id}`),
    importInstrumentos: (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/admin/instrumentos/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Relatorios
    getStats: (params?: { search?: string, date?: string, eventId?: string, regionalId?: string }) => api.get<Stats>('/admin/relatorios/stats', { params }),
    getExecutiveStats: () => api.get<ExecutiveStats>('/admin/relatorios/executivo'),
    getBIStats: () => api.get<BIStats>('/admin/relatorios/bi'),
    exportCsv: async () => {
        const response = await api.get('/admin/relatorios/export', { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'relatorio_presencas.csv')
        document.body.appendChild(link)
        link.click()
        link.remove()
    },

    downloadPdf: async (ensaioId: string, ensaioNome: string) => {
        const response = await api.get(`/admin/relatorios/${ensaioId}/pdf`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        const safeName = ensaioNome.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
        link.setAttribute('download', `RELATORIO_OFICIAL_${safeName}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    downloadAnaliticoPdf: async (ensaioId: string, ensaioNome: string) => {
        const response = await api.get(`/admin/relatorios/${ensaioId}/analitico/pdf`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        const safeName = ensaioNome.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
        link.setAttribute('download', `RELATORIO_ANALITICO_${safeName}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    downloadConsolidadoPdf: async () => {
        const response = await api.get('/admin/relatorios/consolidado/pdf', { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `RELATORIO_CONSOLIDADO_GERAL.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    // Usuários
    getUsers: () => api.get<User[]>('/admin/users'),
    createUser: (data: any) => api.post('/admin/users', data),
    updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    assignEvento: (id: string, evento_id: string | null) => api.patch(`/admin/users/${id}/evento`, { evento_id }),
    summonUsers: (ensaioId: string, userIds: string[]) => api.post(`/admin/ensaios/${ensaioId}/summon`, { userIds }),

    // Regionais
    getRegionais: () => api.get<Regional[]>('/admin/regionais'),
    createRegional: (data: { nome: string; setor?: string }) => api.post('/admin/regionais', data),
    updateRegional: (id: string, data: { nome?: string; setor?: string; ativo?: boolean }) => api.patch(`/admin/regionais/${id}`, data),
    deleteRegional: (id: string) => api.delete(`/admin/regionais/${id}`)
}
