
import { useState, useEffect } from 'react'
import { AdminService, Evento, User as UserType } from '../../../services/admin.service'
import { Plus, Users, Check, Search, X, Calendar as CalendarIcon, MapPin, Shield, Map as MapIcon } from 'lucide-react'
import dayjs from 'dayjs'
import { ModalBase } from '../../../components/ModalBase'
import { ActionButtons } from '../../../components/ActionButtons'

export function EnsaiosTab() {
    const [eventos, setEventos] = useState<Evento[]>([])
    const [allUsers, setAllUsers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [summonModalOpen, setSummonModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<Evento | null>(null)
    const [summonItem, setSummonItem] = useState<Evento | null>(null)

    // Form State
    const [nome, setNome] = useState('')
    const [dataHoraInicio, setDataHoraInicio] = useState('')
    const [dataHoraFim, setDataHoraFim] = useState('')
    const [ativo, setAtivo] = useState(true)
    const [anciaoAtendimento, setAnciaoAtendimento] = useState('')
    const [regionalPrincipal, setRegionalPrincipal] = useState('')
    const [regionalSecundario, setRegionalSecundario] = useState('')
    const [localEvento, setLocalEvento] = useState('')
    const [cidadeEvento, setCidadeEvento] = useState('')

    // Summon State
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [userSearchTerm, setUserSearchTerm] = useState('')

    const fetchEventos = async () => {
        try {
            const res = await AdminService.getEventos()
            setEventos(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await AdminService.getUsers()
            setAllUsers(res.data)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchEventos()
        fetchUsers()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        // 1. Validations
        const inicio = dayjs(dataHoraInicio)
        const fim = dayjs(dataHoraFim)

        if (fim.isBefore(inicio) || fim.isSame(inicio)) {
            alert('A data/hora de término deve ser após o início.')
            return
        }

        if (regionalSecundario && regionalSecundario.trim().toUpperCase() === regionalPrincipal.trim().toUpperCase()) {
            alert('O Regional Secundário não pode ser igual ao Principal.')
            return
        }

        try {
            const payload = {
                nome: nome.trim().toUpperCase(),
                dataEvento: inicio.startOf('day').toISOString(),
                dataHoraInicio: inicio.toISOString(),
                dataHoraFim: fim.toISOString(),
                ativo,
                anciaoAtendimento: anciaoAtendimento.trim().toUpperCase(),
                regionalPrincipal: regionalPrincipal.trim().toUpperCase(),
                regionalSecundario: regionalSecundario.trim().toUpperCase() || undefined,
                localEvento: localEvento.trim().toUpperCase(),
                cidadeEvento: cidadeEvento.trim().toUpperCase()
            }
            if (editItem) {
                await AdminService.updateEvento(editItem.id, payload)
            } else {
                await AdminService.createEvento(payload)
            }
            fetchEventos()
            closeModal()
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao salvar o evento. Verifique os dados inseridos.')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return
        try {
            await AdminService.deleteEvento(id)
            fetchEventos()
        } catch (e) {
            alert('Erro ao excluir')
        }
    }

    const handleSummon = async () => {
        if (!summonItem) return
        try {
            await AdminService.summonUsers(summonItem.id, selectedUserIds)
            alert('Convocação realizada com sucesso!')
            setSummonModalOpen(false)
            fetchEventos()
        } catch (e) {
            alert('Erro ao convocar usuários')
        }
    }

    const openModal = (item?: Evento) => {
        if (item) {
            setEditItem(item)
            setNome(item.nome)
            setDataHoraInicio(dayjs(item.dataHoraInicio).format('YYYY-MM-DDTHH:mm'))
            setDataHoraFim(dayjs(item.dataHoraFim).format('YYYY-MM-DDTHH:mm'))
            setAtivo(item.ativo)
            setAnciaoAtendimento(item.anciaoAtendimento || '')
            setRegionalPrincipal(item.regionalPrincipal || item.regionalRegente || '')
            setRegionalSecundario(item.regionalSecundario || item.regionalRegente2 || '')
            setLocalEvento(item.localEvento || '')
            setCidadeEvento(item.cidadeEvento || '')
        } else {
            setEditItem(null)
            setNome('')
            setDataHoraInicio('')
            setDataHoraFim('')
            setAtivo(true)
            setAnciaoAtendimento('')
            setRegionalPrincipal('')
            setRegionalSecundario('')
            setLocalEvento('')
            setCidadeEvento('')
        }
        setModalOpen(true)
    }

    const openSummonModal = (item: Evento) => {
        setSummonItem(item)
        const summonedIds = allUsers.filter(u => u.ensaioRegionalId === item.id).map(u => u.id)
        setSelectedUserIds(summonedIds)
        setSummonModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditItem(null)
    }

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    )

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-text uppercase tracking-tight leading-none">Eventos Regionais</h2>
                    <p className="text-[10px] text-subtext mt-1 uppercase tracking-widest font-black opacity-60">Planejamento e Convocação Ministerial</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 h-12 uppercase font-black tracking-widest text-[10px]">
                    <Plus size={18} /> Novo Evento
                </button>
            </div>

            <div className="card-saas p-0 overflow-hidden border-none shadow-xl bg-white rounded-[32px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-saas min-w-[900px] lg:min-w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="pl-8 py-5">Designação</th>
                                <th>Janela de Registro</th>
                                <th>Status / Equipe</th>
                                <th className="text-right pr-8">Controle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(eventos ?? []).map(item => (
                                <tr key={item.id} className="group hover:bg-gray-50/30 transition-all">
                                    <td className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <CalendarIcon size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-text uppercase tracking-tight text-sm">{item.nome}</span>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <MapPin size={10} className="text-blue-500" />
                                                    <span className="text-[9px] text-subtext font-black uppercase tracking-tighter">{item.localEvento || 'REGIONAL CCB'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col text-[10px] font-black uppercase tracking-widest gap-1.5">
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit border border-green-100 italic">
                                                <Check size={10} strokeWidth={4} /> {dayjs(item.dataHoraInicio).format('DD/MM HH:mm')}
                                            </div>
                                            <div className="flex items-center gap-2 text-red-500 bg-red-50 px-2 py-1 rounded-lg w-fit border border-red-100 italic">
                                                <X size={10} strokeWidth={4} /> {dayjs(item.dataHoraFim).format('DD/MM HH:mm')}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-2">
                                            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full w-fit ${item.ativo ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.ativo ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {item.ativo ? 'Aceitando Registros' : 'Inativo'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-700 uppercase tracking-tight">
                                                <Users size={12} strokeWidth={3} /> {item._count?.users ?? 0} Músicos Convocados
                                            </div>
                                        </div>
                                    </td>
                                    <td className="pr-8">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openSummonModal(item)}
                                                className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-blue-100"
                                                title="Convocar"
                                            >
                                                <Users size={18} />
                                            </button>
                                            <ActionButtons
                                                onEdit={() => openModal(item)}
                                                onDelete={() => handleDelete(item.id)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal CRUD */}
            <ModalBase isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Editar Detalhes' : 'Novo Evento Regional'}>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="label-saas ml-1">Título do Evento</label>
                            <input
                                className="input-saas font-black uppercase text-xs h-12"
                                value={nome}
                                onChange={e => setNome(e.target.value.toUpperCase())}
                                required
                                placeholder="EX: ENSAIO REGIONAL - SETOR SUL"
                            />
                        </div>

                        <div>
                            <label className="label-saas ml-1 text-green-600 uppercase tracking-widest text-[10px] font-black">Início (Abre Registro)</label>
                            <input
                                type="datetime-local"
                                className="input-saas font-bold h-12 text-sm"
                                value={dataHoraInicio}
                                onChange={e => setDataHoraInicio(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="label-saas ml-1 text-red-500 uppercase tracking-widest text-[10px] font-black">Fim (Fecha Registro)</label>
                            <input
                                type="datetime-local"
                                className="input-saas font-bold h-12 text-sm"
                                value={dataHoraFim}
                                onChange={e => setDataHoraFim(e.target.value)}
                                required
                            />
                        </div>

                        <div className="md:col-span-2 p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ativo}
                                    onChange={e => setAtivo(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-[10px] font-black text-text uppercase tracking-widest">Habilitar Formulário de Presença</span>
                            </label>
                        </div>

                        <div>
                            <label className="label-saas ml-1 flex items-center gap-2"><Shield size={12} className="text-blue-500" /> Ancião em Atendimento</label>
                            <input className="input-saas uppercase font-black text-[10px] h-12" value={anciaoAtendimento} onChange={e => setAnciaoAtendimento(e.target.value.toUpperCase())} placeholder="NOME DO ANCIÃO" />
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-saas ml-1 flex items-center gap-2"><MapIcon size={12} className="text-blue-500" /> Regional Principal *</label>
                                <input
                                    className="input-saas uppercase font-black text-[10px] h-12"
                                    value={regionalPrincipal}
                                    onChange={e => setRegionalPrincipal(e.target.value.toUpperCase())}
                                    placeholder="EX: SETOR SUL"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label-saas ml-1 flex items-center gap-2"><MapIcon size={12} className="text-blue-500" /> Regional Secundário</label>
                                <input
                                    className="input-saas uppercase font-black text-[10px] h-12"
                                    value={regionalSecundario}
                                    onChange={e => setRegionalSecundario(e.target.value.toUpperCase())}
                                    placeholder="OPCIONAL"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-saas ml-1 flex items-center gap-2"><MapPin size={12} className="text-blue-500" /> Local (Casa de Oração)</label>
                                <input className="input-saas uppercase font-black text-[10px] h-12" value={localEvento} onChange={e => setLocalEvento(e.target.value.toUpperCase())} placeholder="BAIRRO / LOCAL" />
                            </div>
                            <div>
                                <label className="label-saas ml-1 flex items-center gap-2"><MapPin size={12} className="text-blue-500" /> Cidade</label>
                                <input className="input-saas uppercase font-black text-[10px] h-12" value={cidadeEvento} onChange={e => setCidadeEvento(e.target.value.toUpperCase())} placeholder="CIDADE DO EVENTO" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={closeModal} className="w-full sm:flex-1 h-14 rounded-2xl text-subtext font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gray-50 transition-all">Descartar</button>
                        <button type="submit" className="w-full sm:flex-1 btn-primary h-14 uppercase font-black tracking-[0.2em] text-[10px] shadow-xl shadow-blue-600/20">Finalizar Cadastro</button>
                    </div>
                </form>
            </ModalBase>

            {/* Modal de Convocação (Summon) */}
            <ModalBase isOpen={summonModalOpen} onClose={() => setSummonModalOpen(false)} title="Convocação Ministerial" maxWidth="max-w-2xl">
                <div className="space-y-6">
                    <div className="flex flex-col gap-1 p-5 rounded-[24px] bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70">Evento Selecionado</span>
                        <h4 className="text-lg font-black uppercase tracking-tight">{summonItem?.nome}</h4>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar músicos por nome ou e-mail..."
                            className="input-saas pl-12 h-14 bg-white border-gray-100 focus:border-blue-200 shadow-sm"
                            value={userSearchTerm}
                            onChange={e => setUserSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                        {filteredUsers.map(user => (
                            <label key={user.id} className={`flex items-center gap-3 p-4 rounded-[20px] border transition-all cursor-pointer group ${selectedUserIds.includes(user.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-gray-50 hover:bg-gray-50'}`}>
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="w-6 h-6 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedUserIds([...selectedUserIds, user.id])
                                            else setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className={`font-black uppercase tracking-tight text-[11px] truncate ${selectedUserIds.includes(user.id) ? 'text-blue-700' : 'text-text'}`}>{user.name}</span>
                                    <span className="text-[9px] text-slate-400 font-bold truncate opacity-80">{user.email}</span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                            <span className="text-[10px] font-black text-text uppercase tracking-widest">{selectedUserIds.length} Músicos Selecionados</span>
                        </div>
                        <button onClick={handleSummon} className="w-full sm:w-auto btn-primary h-12 px-10 uppercase font-black tracking-widest text-[10px] shadow-lg shadow-blue-600/10">Confirmar Convocação</button>
                    </div>
                </div>
            </ModalBase>
        </div>
    )
}
