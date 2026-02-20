
import { useState, useEffect } from 'react'
import { AdminService, ExecutiveStats } from '../../../services/admin.service'
import {
    TrendingUp,
    Users,
    Calendar,
    CheckCircle2,
    Map as MapIcon,
    ArrowUpRight,
    Trophy,
    BarChart as BarChartIcon
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell
} from 'recharts'

export function ExecutivoTab() {
    const [stats, setStats] = useState<ExecutiveStats | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await AdminService.getExecutiveStats()
            setStats(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) return <div className="flex justify-center p-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    if (!stats) return <div className="p-12 text-center text-subtext uppercase font-black tracking-widest">Erro ao carregar dados executivos</div>

    const metrics = [
        { title: 'Total de Regionais', value: stats.totalRegionais, icon: MapIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Eventos Realizados', value: stats.totalEventos, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: 'Presenças Consolidadas', value: stats.totalPresencas, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Usuários Ativos', value: stats.totalUsuarios, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    ]

    const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#1e40af']

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-text tracking-tight uppercase flex items-center gap-3">
                        <TrendingUp className="text-blue-600" size={28} /> Painel Executivo
                    </h1>
                    <p className="text-sm text-subtext font-medium uppercase tracking-widest opacity-70">Visão estratégica consolidada de todas as regionais</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform ${m.color}`}>
                            <m.icon size={100} />
                        </div>
                        <div className="flex flex-col gap-4 relative z-10">
                            <div className={`p-3 rounded-2xl w-fit ${m.bg} ${m.color}`}>
                                <m.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-subtext uppercase tracking-widest mb-1">{m.title}</p>
                                <p className="text-3xl font-black text-text">{m.value.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Comparison Chart */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-[450px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <BarChartIcon size={20} />
                            </div>
                            <h3 className="text-sm font-black text-text uppercase tracking-widest">Presenças por Regional</h3>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.presencasPorRegional} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="nome"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                                    interval={0}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900' }}
                                />
                                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
                                    {stats.presencasPorRegional.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Evolution Chart */}
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-[450px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="text-sm font-black text-text uppercase tracking-widest">Evolução Mensal (Consolidado)</h3>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.evolucaoMensal} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="mes"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#2563eb"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ranking Table */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                                <Trophy size={20} />
                            </div>
                            <h3 className="text-sm font-black text-text uppercase tracking-widest">Ranking de Engajamento Regional</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-subtext uppercase tracking-widest">Regional</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-subtext uppercase tracking-widest">Presenças</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-black text-subtext uppercase tracking-widest">Eventos</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-subtext uppercase tracking-widest">Desempenho</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.rankingRegionais.map((r, i) => {
                                    const evCount = stats.eventosPorRegional.find(er => er.nome === r.nome)?.total || 0;
                                    return (
                                        <tr key={i} className="hover:bg-gray-50/30 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        i === 1 ? 'bg-slate-100 text-slate-600' :
                                                            i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-subtext'
                                                        }`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-black text-sm text-text uppercase tracking-tight">{r.nome}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="font-bold text-sm text-text">{r.total}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center text-sm font-bold text-subtext">
                                                {evCount}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 text-green-600 font-black text-[10px]">
                                                    <ArrowUpRight size={14} />
                                                    {((r.total / (stats.totalPresencas || 1)) * 100).toFixed(1)}%
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Additional Info / Legend */}
                <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-4">Nota Estratégica</h4>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                            Os dados apresentados são consolidados em tempo real. O ranking considera o volume total de participações registradas em cada regional.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Dados Auditados</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Conformidade SaaS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
