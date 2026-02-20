
import { useState, useEffect } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { Check, X, MapPin, Music, UserCheck, AlertCircle, Info, SendHorizontal, Clock } from 'lucide-react'
import dayjs from 'dayjs'

interface Cidade {
    id: string
    nome: string
    nomeExibicao?: string
}

interface Instrumento {
    id: string
    nome: string
}

interface Funcao {
    id: string
    nome: string
}

interface ActiveEvent {
    id: string
    nome: string
    dataEvento: string
    dataHoraInicio: string
    dataHoraFim: string
    localEvento?: string
    modoConvocacao: boolean
}

export function PresencaPage() {
    const { user } = useAuth()
    const [funcao, setFuncao] = useState('')
    const [funcoes, setFuncoes] = useState<Funcao[]>([])
    const [cidades, setCidades] = useState<Cidade[]>([])
    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
    const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null)
    const [eventLoading, setEventLoading] = useState(true)

    const [selectedCidadeId, setSelectedCidadeId] = useState('')
    const [newCidadeName, setNewCidadeName] = useState('')

    const [selectedInstrumentoId, setSelectedInstrumentoId] = useState('')
    const [newInstrumentoName, setNewInstrumentoName] = useState('')

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const fetchListsAndEvent = async () => {
        try {
            const [cidadesRes, instRes, funcoesRes, eventRes] = await Promise.all([
                api.get('/presenca/cidades'),
                api.get('/presenca/instrumentos'),
                api.get('/presenca/funcoes'),
                api.get('/presenca/active-event').catch(() => ({ data: null }))
            ])
            setCidades(cidadesRes.data)
            setInstrumentos(instRes.data)
            setFuncoes(funcoesRes.data)
            setActiveEvent(eventRes.data)
        } catch (e) {
            console.error('Failed to fetch lists or event', e)
        } finally {
            setEventLoading(false)
        }
    }

    useEffect(() => {
        fetchListsAndEvent()
    }, [])

    const now = dayjs()
    const eventStart = activeEvent?.dataHoraInicio ? dayjs(activeEvent.dataHoraInicio) : null
    const eventEnd = activeEvent?.dataHoraFim ? dayjs(activeEvent.dataHoraFim) : null

    const isBeforeEvent = eventStart && now.isBefore(eventStart)
    const isAfterEvent = eventEnd && now.isAfter(eventEnd)
    const isWithinWindow = eventStart && eventEnd && now.isAfter(eventStart) && now.isBefore(eventEnd)

    // Rule: if an active event exists and we are in the window, we can register.
    // Convocação check is now server-side and only if modoConvocacao is true.
    const canRegister = !!activeEvent && isWithinWindow

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canRegister) {
            setStatus('error')
            setErrorMsg(isBeforeEvent ? 'O período de registro ainda não iniciou.' : 'O período de registro foi encerrado.')
            return
        }

        setStatus('loading')
        setErrorMsg('')

        const payload: any = { funcaoMinisterio: funcao }

        if (selectedCidadeId) payload.cidadeId = selectedCidadeId
        else if (newCidadeName) payload.cidadeNome = newCidadeName
        else {
            setStatus('error')
            setErrorMsg('Selecione ou informe sua cidade de origem.')
            return
        }

        if (selectedInstrumentoId) payload.instrumentoId = selectedInstrumentoId
        else if (newInstrumentoName) payload.instrumentoNome = newInstrumentoName

        try {
            await api.post('/presenca', payload)
            setStatus('success')
            setFuncao('')
            setSelectedCidadeId('')
            setNewCidadeName('')
            setSelectedInstrumentoId('')
            setNewInstrumentoName('')
            fetchListsAndEvent()
            setTimeout(() => setStatus('idle'), 4000)
        } catch (e: any) {
            setStatus('error')
            setErrorMsg(e.response?.data?.message || 'Erro ao registrar presença. Tente novamente.')
        }
    }

    if (eventLoading) return (
        <div className="flex justify-center p-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <div className="flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto py-2 pb-32 md:pb-12 animate-fade-in">
            {/* User Intro */}
            <div className="flex items-center justify-between px-2 md:px-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-text font-inter tracking-tight">Olá, {user?.name || 'Irmão(ã)'}!</h1>
                    <p className="text-[10px] md:text-sm text-subtext font-medium uppercase tracking-[0.2em] opacity-60">Portal de Presença Musical</p>
                </div>
                <div className="bg-primary-light/10 p-3 md:p-4 rounded-3xl text-primary font-bold hidden sm:block shadow-sm">
                    <UserCheck size={24} className="md:w-7 md:h-7" />
                </div>
            </div>

            {/* Event Status Card */}
            <div className={`p-4 md:p-8 rounded-[32px] md:rounded-[40px] border-2 transition-all shadow-2xl relative overflow-hidden ${canRegister
                ? 'bg-primary border-primary-light text-white shadow-primary/20'
                : 'bg-white border-gray-100 text-text shadow-xl'
                }`}>

                {canRegister && (
                    <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                        <Music size={80} className="md:w-[140px] md:h-[140px]" />
                    </div>
                )}

                <div className="flex items-start gap-4 md:gap-6 relative z-10">
                    <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-md ${canRegister ? 'bg-white/20' : 'bg-gray-100 text-subtext'}`}>
                        {canRegister ? <Music size={24} className="md:w-8 md:h-8" /> : (isBeforeEvent || isAfterEvent ? <Clock size={24} className="md:w-8 md:h-8" /> : <AlertCircle size={24} className="md:w-8 md:h-8" />)}
                    </div>
                    <div className="flex-1">
                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] ${canRegister ? 'opacity-60' : 'text-primary'}`}>
                            {activeEvent ? 'Evento em Andamento' : 'Status do Registro'}
                        </span>
                        <h2 className={`text-lg md:text-2xl font-black leading-tight mt-1 uppercase tracking-tight ${!canRegister && 'text-text'}`}>
                            {activeEvent?.nome || 'Nenhum Evento Aberto'}
                        </h2>

                        {activeEvent && (
                            <div className="mt-3 md:mt-5 flex flex-wrap gap-2">
                                {isBeforeEvent && (
                                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black bg-amber-50 text-amber-600 px-4 md:px-5 py-1.5 md:py-2 rounded-full border border-amber-100 uppercase tracking-tighter">
                                        <Clock size={14} className="md:w-4 md:h-4" /> INICIA: {dayjs(eventStart).format('DD/MM HH:mm')}
                                    </div>
                                )}
                                {isAfterEvent && (
                                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black bg-red-50 text-red-600 px-4 md:px-5 py-1.5 md:py-2 rounded-full border border-red-100 uppercase tracking-tighter">
                                        <X size={14} className="md:w-4 md:h-4" /> ENCERRADO EM: {dayjs(eventEnd).format('DD/MM HH:mm')}
                                    </div>
                                )}
                                {isWithinWindow && (
                                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black bg-white/20 px-4 md:px-5 py-1.5 md:py-2 rounded-full border border-white/30 animate-pulse uppercase tracking-widest">
                                        <Check size={14} className="md:w-4 md:h-4" /> ATÉ {dayjs(eventEnd).format('HH:mm')}
                                    </div>
                                )}
                                {activeEvent.modoConvocacao && isWithinWindow && (
                                    <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black bg-blue-500/30 px-4 md:px-5 py-1.5 md:py-2 rounded-full border border-white/20 uppercase tracking-widest">
                                        <UserCheck size={12} className="md:w-3.5 md:h-3.5" /> EXIGE CONVOCAÇÃO
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success/Error Alerts */}
            {status === 'success' && (
                <div className="p-4 md:p-6 bg-green-500 text-white rounded-[24px] md:rounded-[32px] flex items-center gap-4 animate-in zoom-in duration-300 shadow-xl shadow-green-500/20">
                    <div className="bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl"><Check size={24} className="md:w-7 md:h-7" /></div>
                    <p className="font-black text-xs md:text-sm uppercase tracking-widest leading-relaxed">Presença confirmada! Que Deus abençoe seu ministério.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="p-4 md:p-6 bg-red-50 text-red-600 border-2 border-red-100 rounded-[24px] md:rounded-[32px] flex items-center gap-4 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="bg-red-600 p-2 md:p-3 rounded-xl md:rounded-2xl text-white shadow-lg shadow-red-600/20"><X size={24} className="md:w-7 md:h-7" /></div>
                    <div>
                        <p className="font-black text-[9px] md:text-[10px] uppercase opacity-60 tracking-widest">Falha no Registro</p>
                        <p className="font-black text-xs md:text-sm">{errorMsg}</p>
                    </div>
                </div>
            )}

            {/* Form */}
            {!canRegister ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[40px] p-16 text-center flex flex-col items-center gap-6 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                        <X size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-text uppercase tracking-tight">Registro Autenticado Indisponível</h3>
                        <p className="text-sm text-subtext font-semibold max-w-[320px] mt-3 mx-auto leading-relaxed">
                            {isBeforeEvent
                                ? 'O formulário será liberado automaticamente assim que o portão de presença for aberto.'
                                : isAfterEvent
                                    ? 'A janela de registro para este evento regional foi encerrada.'
                                    : 'Não existem eventos musicais ativos ou programados para sua regional no momento.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card-saas md:p-10 shadow-2xl shadow-primary/5">
                    <form onSubmit={handleSubmit} className="space-y-8 px-4 py-8 md:p-0">
                        {/* Funcao */}
                        <div className="space-y-3 md:space-y-4">
                            <label className="label-saas flex items-center gap-2">
                                <Info size={20} className="text-primary md:w-6 md:h-6 shrink-0" /> QUAL SUA FUNÇÃO NO MINISTÉRIO?
                            </label>
                            {funcoes.length > 0 ? (
                                <select
                                    className="input-saas font-semibold h-14 md:h-14 text-base bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                                    value={funcao}
                                    onChange={e => setFuncao(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione sua função</option>
                                    {(funcoes ?? []).map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                                </select>
                            ) : (
                                <input
                                    className="input-saas uppercase font-semibold h-14 md:h-14 text-base bg-gray-50 border-transparent focus:bg-white"
                                    value={funcao}
                                    onChange={e => setFuncao(e.target.value.toUpperCase())}
                                    placeholder="EX: MÚSICO, ORGANISTA..."
                                    required
                                />
                            )}
                        </div>

                        {/* Cidade */}
                        <div className="space-y-3 md:space-y-4">
                            <label className="label-saas flex items-center gap-2">
                                <MapPin size={20} className="text-primary md:w-6 md:h-6 shrink-0" /> CIDADE - COMUM
                            </label>
                            <div className="space-y-3 md:space-y-4">
                                <select
                                    className="input-saas font-semibold h-14 md:h-14 text-base bg-gray-50 border-transparent focus:bg-white transition-all cursor-pointer"
                                    value={selectedCidadeId}
                                    onChange={e => {
                                        setSelectedCidadeId(e.target.value)
                                        if (e.target.value) setNewCidadeName('')
                                    }}
                                    disabled={!!newCidadeName}
                                >
                                    <option value="">Selecione na lista</option>
                                    {(cidades ?? []).map(c => <option key={c.id} value={c.id}>{c.nomeExibicao || c.nome}</option>)}
                                </select>
                                <div className="flex items-center gap-4 px-4">
                                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                                    <span className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">ou digite sua cidade</span>
                                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                                </div>
                                <input
                                    className="input-saas uppercase font-semibold h-14 md:h-14 text-base bg-gray-50 border-transparent focus:bg-white disabled:opacity-30"
                                    value={newCidadeName}
                                    onChange={e => {
                                        setNewCidadeName(e.target.value.toUpperCase())
                                        if (e.target.value) setSelectedCidadeId('')
                                    }}
                                    placeholder="Ex. CIDADE - COMUM"
                                    disabled={!!selectedCidadeId}
                                />
                            </div>
                        </div>

                        {/* Instrumento */}
                        <div className="space-y-3 md:space-y-4">
                            <label className="label-saas flex items-center gap-2">
                                <Music size={20} className="text-primary md:w-6 md:h-6 shrink-0" /> QUAL INSTRUMENTO? (OPCIONAL)
                            </label>
                            <div className="space-y-3 md:space-y-4">
                                <select
                                    className="input-saas font-semibold h-14 md:h-14 text-base bg-gray-50 border-transparent focus:bg-white cursor-pointer"
                                    value={selectedInstrumentoId}
                                    onChange={e => {
                                        setSelectedInstrumentoId(e.target.value)
                                        if (e.target.value) setNewInstrumentoName('')
                                    }}
                                    disabled={!!newInstrumentoName}
                                >
                                    <option value="">Selecione na lista</option>
                                    {(instrumentos ?? []).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                                </select>
                                <input
                                    className="input-saas uppercase font-semibold h-14 md:h-14 text-base bg-gray-50 border-transparent focus:bg-white disabled:opacity-30"
                                    value={newInstrumentoName}
                                    onChange={e => {
                                        setNewInstrumentoName(e.target.value.toUpperCase())
                                        if (e.target.value) setSelectedInstrumentoId('')
                                    }}
                                    placeholder="DIGITE O INSTRUMENTO"
                                    disabled={!!selectedInstrumentoId}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 md:pt-8 fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-gray-100 md:border-t-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:relative md:shadow-none z-50">
                            <button
                                type="submit"
                                disabled={status === 'loading' || !canRegister}
                                className="bg-primary w-full h-14 md:h-16 rounded-xl md:rounded-[32px] text-white font-black text-lg md:text-xl shadow-xl shadow-primary/20 hover:bg-primary-light active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-20 uppercase tracking-[0.1em]"
                            >
                                {status === 'loading' ? (
                                    <div className="h-5 w-5 md:h-6 md:w-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <><SendHorizontal size={22} className="md:w-6 md:h-6" /> Confirmar Presença</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Footer Help */}
            <div className="text-center pb-12 opacity-30 mt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">SISTEMA DE GESTÃO MUSICAL INSTITUCIONAL</p>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
            </div>
        </div>
    )
}
