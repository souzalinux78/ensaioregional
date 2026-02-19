
import { useState, useEffect, useCallback } from 'react'
import { AdminService, Stats } from '../../../services/admin.service'
import { Download, FileText, BarChart, Search, Calendar, FileStack, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'

export function RelatoriosTab() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDate, setFilterDate] = useState('')
    const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)
    const [pdfAnaliticoLoadingId, setPdfAnaliticoLoadingId] = useState<string | null>(null)
    const [consolidadoLoading, setConsolidadoLoading] = useState(false)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        try {
            const res = await AdminService.getStats({
                search: searchTerm || undefined,
                date: filterDate || undefined
            })
            setStats(res.data)
        } catch (e) {
            console.error('Erro ao buscar estatísticas', e)
        } finally {
            setLoading(false)
        }
    }, [searchTerm, filterDate])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStats()
        }, 400) // Debounce
        return () => clearTimeout(timer)
    }, [fetchStats])

    const handleDownloadPdf = async (ensaioId: string, ensaioNome: string) => {
        setPdfLoadingId(ensaioId)
        try {
            await AdminService.downloadPdf(ensaioId, ensaioNome)
        } catch (e) {
            alert('Erro ao gerar o relatório PDF. Verifique se o evento possui presenças.')
        } finally {
            setPdfLoadingId(null)
        }
    }

    const handleDownloadAnaliticoPdf = async (ensaioId: string, ensaioNome: string) => {
        setPdfAnaliticoLoadingId(ensaioId)
        try {
            await AdminService.downloadAnaliticoPdf(ensaioId, ensaioNome)
        } catch (e) {
            alert('Erro ao gerar o relatório analítico.')
        } finally {
            setPdfAnaliticoLoadingId(null)
        }
    }

    const handleDownloadConsolidado = async () => {
        setConsolidadoLoading(true)
        try {
            await AdminService.downloadConsolidadoPdf()
        } catch (e) {
            alert('Erro ao gerar relatório consolidado.')
        } finally {
            setConsolidadoLoading(false)
        }
    }

    // Since we now filter in the backend, filteredEventos is just the backend response
    const eventos = stats?.byEvento ?? []

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black text-text tracking-tight uppercase">Arquivo & Relatórios</h1>
                    <p className="text-sm text-subtext font-medium uppercase tracking-widest opacity-70">Geração de documentos institucionais</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <button
                        onClick={handleDownloadConsolidado}
                        disabled={consolidadoLoading}
                        className="h-12 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 flex-1 lg:flex-none justify-center px-6 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        {consolidadoLoading ? <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" /> : <FileStack size={16} />}
                        Consolidado
                    </button>
                    <button
                        onClick={() => AdminService.exportCsv()}
                        className="h-12 bg-white border border-gray-100 text-text px-6 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-gray-50 transition-all flex items-center gap-2 flex-1 lg:flex-none justify-center shadow-sm"
                    >
                        <Download size={16} /> Base CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome do evento..."
                        className="input-saas pl-12 h-14 bg-white border-gray-100 focus:border-blue-200"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                        type="date"
                        className="input-saas pl-12 h-14 bg-white border-gray-100 focus:border-blue-200 font-bold"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Display */}
            <div className="card-saas p-0 overflow-hidden border-none shadow-xl bg-white rounded-[32px]">
                <div className="p-6 lg:px-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                    <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[9px]">
                        <BarChart size={14} strokeWidth={3} /> {searchTerm || filterDate ? 'Resultados da Busca' : 'Histórico Institucional'}
                    </div>
                    {loading ? (
                        <div className="animate-spin h-3 w-3 border-2 border-blue-200 border-t-blue-600 rounded-full" />
                    ) : (
                        <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg uppercase">
                            {eventos.length} Eventos encontrados
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-saas min-w-[800px] lg:min-w-full">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="pl-8 py-5">Identificação do Evento</th>
                                <th>Data de Realização</th>
                                <th className="text-center">Presenças</th>
                                <th className="text-right pr-8">Documentação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {eventos.length > 0 ? (
                                eventos.map((e) => (
                                    <tr key={e.id} className="hover:bg-gray-50/20 transition-all group">
                                        <td className="pl-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-text uppercase tracking-tight text-sm">{e.nome}</span>
                                                <span className="text-[10px] text-subtext font-bold uppercase tracking-widest opacity-60 italic">Cód: {e.id.substring(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <Calendar size={12} />
                                                {dayjs(e.data).format('DD/MM/YYYY')}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="inline-flex items-center justify-center bg-slate-50 text-slate-600 font-black px-4 py-1.5 rounded-xl text-sm min-w-[50px] border border-slate-100">
                                                {e.total}
                                            </span>
                                        </td>
                                        <td className="pr-8">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownloadPdf(e.id, e.nome)}
                                                    disabled={pdfLoadingId === e.id}
                                                    className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl text-[9px] font-black transition-all disabled:opacity-50 border border-red-100"
                                                >
                                                    {pdfLoadingId === e.id ? <div className="animate-spin border-2 border-red-700/30 border-t-red-700 rounded-full h-3 w-3" /> : <FileText size={12} />}
                                                    SÍNTESE
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadAnaliticoPdf(e.id, e.nome)}
                                                    disabled={pdfAnaliticoLoadingId === e.id}
                                                    className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2.5 rounded-xl text-[9px] font-black transition-all disabled:opacity-50 border border-blue-100"
                                                >
                                                    {pdfAnaliticoLoadingId === e.id ? <div className="animate-spin border-2 border-blue-300 border-t-blue-600 rounded-full h-3 w-3" /> : <BarChart size={12} />}
                                                    ANALÍTICO
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : !loading && (
                                <tr>
                                    <td colSpan={4} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <AlertCircle size={48} strokeWidth={1.5} />
                                            <div className="flex flex-col gap-1">
                                                <p className="font-black uppercase tracking-[0.2em] text-sm text-text">Nenhum evento localizado</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest">Ajuste os filtros para pesquisar no arquivo</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
