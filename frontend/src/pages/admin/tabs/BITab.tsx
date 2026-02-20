
import { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { AdminService, BIStats } from '../../../services/admin.service'
import {
    Activity,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Trophy,
    Calendar,
    ArrowRight,
    Download
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts'

export function BITab() {
    const [stats, setStats] = useState<BIStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    const chartRefComparison = useRef<HTMLDivElement>(null)
    const chartRefGoals = useRef<HTMLDivElement>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await AdminService.getBIStats()
            setStats(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleExportPdf = async () => {
        if (!stats || !chartRefComparison.current || !chartRefGoals.current) return

        setExporting(true)
        try {
            const compCanvas = await html2canvas(chartRefComparison.current, { scale: 2, backgroundColor: '#ffffff' })
            const goalsCanvas = await html2canvas(chartRefGoals.current, { scale: 2, backgroundColor: '#ffffff' })

            const chartImages = {
                comparison: compCanvas.toDataURL('image/png'),
                goals: goalsCanvas.toDataURL('image/png')
            }

            await AdminService.downloadBIPdf(stats, chartImages)
        } catch (e) {
            console.error('PDF_EXPORT_ERROR', e)
        } finally {
            setExporting(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) return <div className="flex justify-center p-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    if (!stats) return <div className="p-12 text-center text-subtext uppercase font-black tracking-widest">Erro ao carregar inteligência de dados</div>

    const { resumoGeral } = stats

    const metaPercent = resumoGeral.metaGlobal > 0
        ? (resumoGeral.totalPresencas / resumoGeral.metaGlobal) * 100
        : 0

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div>
                    <h1 className="text-2xl font-black text-text tracking-tight uppercase flex items-center gap-3">
                        <Activity className="text-primary" size={28} /> Inteligência de Negócio (BI)
                    </h1>
                    <p className="text-sm text-subtext font-medium uppercase tracking-widest opacity-70">Análise estratégica de crescimento e metas</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExportPdf}
                        disabled={exporting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-100"
                    >
                        {exporting ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                            <Download size={16} />
                        )}
                        {exporting ? 'Gerando...' : 'Exportar Relatório BI'}
                    </button>
                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm hidden md:block">
                        <span className="text-[10px] font-black text-subtext uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Mês de Referência: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Strategic Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Total Presenças card */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-subtext uppercase tracking-widest mb-1">Presenças Total (Mês)</p>
                            <div className="flex items-baseline gap-3">
                                <p className="text-4xl font-black text-text">{resumoGeral.totalPresencas}</p>
                                <div className={`flex items-center gap-1 text-[11px] font-black ${resumoGeral.crescimentoGlobal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {resumoGeral.crescimentoGlobal >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {Math.abs(resumoGeral.crescimentoGlobal)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta Global card */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-subtext uppercase tracking-widest mb-1">Meta Global do Mês</p>
                            <div className="flex items-baseline gap-3">
                                <p className="text-4xl font-black text-text">{resumoGeral.metaGlobal || '---'}</p>
                                <span className="text-[10px] font-black text-subtext uppercase">objetivo</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Global card */}
                <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:rotate-0 transition-transform">
                        <Activity size={100} />
                    </div>
                    <div className="relative z-10 flex flex-col gap-5">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status de Metas</p>
                            <span className="text-xs font-black text-primary uppercase tracking-tighter">{metaPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: `${Math.min(metaPercent, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-bold opacity-60 uppercase">Progresso consolidado das regionais</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Comparativo Mês Atual vs Anterior */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-[480px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-text uppercase tracking-widest">Crescimento Mensal</h3>
                                <p className="text-[10px] font-medium text-subtext uppercase tracking-widest">Mês Atual vs. Mês Anterior por Regional</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0" ref={chartRefComparison}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.comparativoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="regional"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                                <Bar name="Mês Atual" dataKey="mesAtual" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={25} />
                                <Bar name="Mês Anterior" dataKey="mesAnterior" fill="#94a3b8" opacity={0.3} radius={[6, 6, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Meta vs Realizado */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-[480px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <Target size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-text uppercase tracking-widest">Atingimento de Metas</h3>
                                <p className="text-[10px] font-medium text-subtext uppercase tracking-widest">Desempenho Realizado vs. Planejado</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0" ref={chartRefGoals}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.metasVsRealizado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="regional"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900' }}
                                />
                                <Bar name="Realizado" dataKey="realizado" radius={[6, 6, 0, 0]} barSize={40}>
                                    {stats.metasVsRealizado.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.realizado >= entry.meta && entry.meta > 0 ? '#059669' : '#7c3aed'} />
                                    ))}
                                </Bar>
                                <Bar name="Meta" dataKey="meta" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance Ranking */}
            <div className="bg-white rounded-[44px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                            <Trophy size={20} />
                        </div>
                        <h3 className="text-sm font-black text-text uppercase tracking-widest">Índice de Performance (Ranking BI)</h3>
                    </div>
                </div>
                <div className="p-4 overflow-x-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.rankingPerformance.map((item: any, i: number) => {
                            const isAchieved = item.percentual >= 100
                            const isWarning = item.percentual < 70 && item.meta > 0

                            return (
                                <div key={i} className="flex flex-col gap-4 p-6 rounded-[32px] bg-gray-50/50 border border-gray-100 hover:border-primary/20 transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-200' :
                                                i === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-100' :
                                                    i === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-100' : 'bg-white text-subtext'
                                                }`}>
                                                {i + 1}
                                            </span>
                                            <span className="font-black text-sm text-text uppercase tracking-tighter">{item.regional}</span>
                                        </div>
                                        {isAchieved ? (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full animate-pulse">
                                                <CheckCircle2 size={12} /> META ATINGIDA
                                            </div>
                                        ) : isWarning ? (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                                <AlertCircle size={12} /> ALERTA DE QUEDA
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-subtext uppercase">
                                            <span>Realizado vs Meta</span>
                                            <span>{item.percentual}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${isAchieved ? 'bg-green-500' : isWarning ? 'bg-amber-500' : 'bg-primary'}`}
                                                style={{ width: `${Math.min(item.percentual, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-subtext uppercase opacity-60">Volume</span>
                                                <span className="text-sm font-black text-text">{item.realizado}</span>
                                            </div>
                                            <ArrowRight className="text-gray-200" size={16} />
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black text-subtext uppercase opacity-60">Meta</span>
                                                <span className="text-sm font-black text-text">{item.meta || '---'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
