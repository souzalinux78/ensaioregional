
import { useState, useEffect, useCallback } from 'react'
import { AdminService, Stats, Evento } from '../../../services/admin.service'
import {
    CalendarDays,
    MapPin,
    Music,
    CheckCircle2,
    Music4,
    Filter,
    RefreshCw
} from 'lucide-react'

export function DashboardTab() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [eventos, setEventos] = useState<Evento[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string>(() => {
        return localStorage.getItem('dashboard:selectedEvent') || 'all'
    })
    const [selectedRegionalId, setSelectedRegionalId] = useState<string>('all')
    const [regionais, setRegionais] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchStats = useCallback(async (eventId?: string, regionalId?: string) => {
        setLoading(true)
        try {
            const res = await AdminService.getStats({
                eventId: eventId === 'all' ? undefined : eventId,
                regionalId: regionalId === 'all' ? undefined : regionalId
            })
            setStats(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchEventos = async () => {
        try {
            const res = await AdminService.getEventos()
            setEventos(res.data)
        } catch (e) {
            console.error(e)
        }
    }

    const fetchRegionais = async () => {
        try {
            const res = await AdminService.getRegionais()
            setRegionais(res.data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchEventos()
        fetchRegionais()
    }, [])

    useEffect(() => {
        fetchStats(selectedEventId, selectedRegionalId)
        fetchEventos()
        if (selectedEventId === 'all') {
            localStorage.removeItem('dashboard:selectedEvent')
        } else {
            localStorage.setItem('dashboard:selectedEvent', selectedEventId)
        }
    }, [selectedEventId, selectedRegionalId, fetchStats])

    const handleRefresh = () => {
        fetchStats(selectedEventId, selectedRegionalId)
        fetchEventos()
    }

    // Eventos Monitorados = mesma lista da aba Eventos (só não-deletados). Array vazio = 0.
    const eventosCount = Array.isArray(eventos) ? eventos.length : 0
    const metrics = [
        { title: 'Total Presenças', value: stats?.totalPresencas || 0, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Músicos / Organistas', value: stats?.byInstrumento?.reduce((acc, curr) => acc + curr.total, 0) || 0, icon: Music4, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: 'Eventos Monitorados', value: selectedEventId === 'all' ? eventosCount : 1, icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Cidades Atendidas', value: stats?.totalCidadesAtendidas || 0, icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-50' },
    ]

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Page Header & Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-text tracking-tight uppercase">Visão Geral</h1>
                    <p className="text-sm text-subtext font-medium uppercase tracking-widest opacity-70">Métricas centrais de participação ministerial</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 sm:min-w-[300px]">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <select
                            className="input-saas pl-12 h-12 bg-white border-gray-100 font-bold text-[11px] uppercase tracking-widest cursor-pointer appearance-none pr-10 overflow-hidden truncate"
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                        >
                            <option value="all">📁 Todos os Eventos (Global)</option>
                            {eventos.map(e => (
                                <option key={e.id} value={e.id}>
                                    📍 {e.nome}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-current rotate-45" />
                        </div>
                    </div>

                    {regionais.length > 0 && (
                        <div className="relative group flex-1 sm:min-w-[250px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                            <select
                                className="input-saas pl-12 h-12 bg-white border-gray-100 font-bold text-[11px] uppercase tracking-widest cursor-pointer appearance-none pr-10 overflow-hidden truncate"
                                value={selectedRegionalId}
                                onChange={(e) => setSelectedRegionalId(e.target.value)}
                            >
                                <option value="all">🌍 Todas as Regionais</option>
                                {regionais.map(r => (
                                    <option key={r.id} value={r.id}>
                                        🏠 {r.nome}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-current rotate-45" />
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleRefresh}
                        className="h-12 w-full sm:w-12 flex items-center justify-center bg-white border border-gray-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-xl transition-all shadow-sm"
                        title="Atualizar"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
                    </button>
                </div>
            </div>

            {loading && !stats ? (
                <div className="flex justify-center p-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform ${m.color}`}>
                                    <m.icon size={80} />
                                </div>
                                <div className="relative z-10 flex flex-col gap-4">
                                    <div className={`p-4 rounded-2xl w-fit ${m.bg} ${m.color}`}>
                                        <m.icon size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-subtext uppercase tracking-[0.2em] mb-1">{m.title}</p>
                                        <p className="text-4xl font-black text-text">{m.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cities Distribution */}
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <MapPin size={20} />
                                </div>
                                <h3 className="text-sm font-black text-text uppercase tracking-widest">Participação por Cidade</h3>
                            </div>
                            <div className="space-y-4">
                                {(stats?.byCidade ?? []).length > 0 ? (
                                    (stats?.byCidade ?? []).slice(0, 5).map((c, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-gray-50/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-text uppercase tracking-tight">{c.nome}</span>
                                                <span className="text-xs font-black bg-white px-3 py-1 rounded-lg border border-gray-100 text-primary">{c.total}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 border-t border-gray-100 pt-2">
                                                {c.bairros.map((b, bi) => (
                                                    <div key={bi} className="flex items-center gap-1.5 grayscale opacity-60">
                                                        <div className="w-1 h-1 rounded-full bg-slate-400" />
                                                        <span className="text-[9px] font-bold text-subtext uppercase">{b.nome} ({b.total})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 opacity-30 font-black text-[10px] uppercase tracking-widest">Nenhuma presença registrada</div>
                                )}
                            </div>
                        </div>

                        {/* Instruments Distribution */}
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                    <Music size={20} />
                                </div>
                                <h3 className="text-sm font-black text-text uppercase tracking-widest">Instrumentos (Top 5)</h3>
                            </div>
                            <div className="space-y-3">
                                {(stats?.byInstrumento ?? []).length > 0 ? (
                                    (stats?.byInstrumento ?? []).slice(0, 5).map((inst, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50">
                                            <span className="text-xs font-bold text-text uppercase tracking-tight">{inst.nome}</span>
                                            <span className="text-xs font-black bg-white px-3 py-1 rounded-lg border border-gray-100 text-primary">{inst.total}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 opacity-30 font-black text-[10px] uppercase tracking-widest">Nenhuma presença registrada</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
