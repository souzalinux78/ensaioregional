
import { useState, useEffect } from 'react'
import { AdminService, User, Evento } from '../../../services/admin.service'
import { Plus, Shield, User as UserIcon, Lock, Link as LinkIcon, Link2Off } from 'lucide-react'
import { ModalBase } from '../../../components/ModalBase'
import { ActionButtons } from '../../../components/ActionButtons'
import { useAuth } from '../../../context/AuthContext'

export function UsersTab() {
    const { user: authUser } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [eventos, setEventos] = useState<Evento[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<User | null>(null)

    // Form State
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<string>('USER')
    const [ensaioRegionalId, setEnsaioRegionalId] = useState<string>('')
    const [regionalId, setRegionalId] = useState<string>('')
    const [regionais, setRegionais] = useState<any[]>([])

    // Admin regional só pode atribuir usuários à(s) sua(s) regional(is); lista para dropdown
    const isAdminRegional = authUser?.role === 'ADMIN_REGIONAL'
    const regionaisOptions = isAdminRegional && authUser?.regionalId
        ? regionais.filter(r => r.id === authUser.regionalId)
        : regionais

    const fetchData = async () => {
        try {
            const [usersRes, eventosRes, regionaisRes] = await Promise.all([
                AdminService.getUsers(),
                AdminService.getEventos(),
                AdminService.getRegionais()
            ])
            setUsers(usersRes.data)
            setEventos(eventosRes.data)
            setRegionais(regionaisRes.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const data: any = {
                name,
                email,
                role,
                ensaioRegionalId: ensaioRegionalId === '' ? null : ensaioRegionalId,
                regionalId: regionalId === '' ? null : regionalId
            }
            if (password) data.password = password

            if (editItem) {
                await AdminService.updateUser(editItem.id, data)
            } else {
                if (!password) {
                    alert('Senha é obrigatória para novos usuários')
                    return
                }
                await AdminService.createUser(data)
            }
            fetchData()
            closeModal()
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao salvar')
        }
    }

    const handleDesvincular = async () => {
        if (!editItem) return
        if (!confirm('Deseja realmente remover o vínculo deste usuário com o evento?')) return

        try {
            await AdminService.updateUser(editItem.id, { ensaioRegionalId: null })
            fetchData()
            closeModal()
        } catch (e: any) {
            alert('Erro ao desvincular usuário')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return
        try {
            await AdminService.deleteUser(id)
            fetchData()
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao excluir')
        }
    }

    const openModal = (item?: User) => {
        if (item) {
            setEditItem(item)
            setName(item.name)
            setEmail(item.email)
            setRole(item.role)
            setEnsaioRegionalId(item.ensaioRegionalId || '')
            setRegionalId(item.regionalId || '')
            setPassword('')
        } else {
            setEditItem(null)
            setName('')
            setEmail('')
            setRole('USER')
            setEnsaioRegionalId('')
            setRegionalId(isAdminRegional && authUser?.regionalId ? authUser.regionalId : '')
            setPassword('')
        }
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditItem(null)
    }

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-text uppercase tracking-tight leading-none">Gestão de Usuários</h2>
                    <p className="text-[10px] text-subtext mt-1 uppercase tracking-widest font-black opacity-60">Níveis de acesso e vínculos regionais</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary flex items-center justify-center gap-2 h-12 w-full sm:w-auto uppercase font-black tracking-widest text-[10px]">
                    <Plus size={18} /> Novo Usuário
                </button>
            </div>

            <div className="card-saas p-0 overflow-hidden border-none shadow-xl bg-white rounded-[32px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-saas min-w-[800px] lg:min-w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="pl-8 py-5">Identificação</th>
                                <th>Privilégio</th>
                                <th>Vínculo Ativo</th>
                                <th className="text-right pr-8">Operações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(users ?? []).map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/30 transition-all">
                                    <td className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-600/10 h-10 w-10 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                                                {item.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-text text-sm uppercase tracking-tight">{item.name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{item.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${item.role.includes('ADMIN') ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {(item.role === 'SUPERADMIN' || item.role === 'ADMIN') ? <Shield size={10} /> : <UserIcon size={10} />}
                                                {item.role === 'ADMIN' ? 'SUPERADMIN' : item.role}
                                            </span>
                                            {item.regional?.nome && (
                                                <span className="text-[8px] font-black text-blue-500 uppercase ml-1">
                                                    @{item.regional.nome}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {item.ensaioRegional?.nome ? (
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <LinkIcon size={12} strokeWidth={3} />
                                                <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px]">{item.ensaioRegional.nome}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-200 uppercase italic">Nenhum</span>
                                        )}
                                    </td>
                                    <td className="pr-8 text-right">
                                        <div className="flex justify-end">
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

            <ModalBase isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Perfil do Usuário' : 'Novo Cadastro'}>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="label-saas ml-1">Nome Completo</label>
                            <input
                                className="input-saas font-black uppercase text-xs h-12"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="NOME DO USUÁRIO"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-saas ml-1">Endereço de E-mail</label>
                            <input
                                type="email"
                                className="input-saas font-bold h-12"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="email@exemplo.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-saas ml-1">{editItem ? 'Alterar Senha (opcional)' : 'Senha de Acesso'}</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="password"
                                    className="input-saas font-bold h-12 pl-12"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required={!editItem}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label-saas ml-1">Nível de Acesso</label>
                            <select
                                className="input-saas font-black uppercase text-[10px] h-12"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            >
                                <option value="USER">USUÁRIO COMUM</option>
                                <option value="ADMIN_REGIONAL">ADMIN REGIONAL</option>
                                <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-saas ml-1">Regional Associada</label>
                            <select
                                className="input-saas font-black uppercase text-[10px] h-12"
                                value={regionalId}
                                onChange={e => setRegionalId(e.target.value)}
                                required={role === 'ADMIN_REGIONAL'}
                                disabled={isAdminRegional && regionaisOptions.length === 1}
                            >
                                <option value="">NENHUMA (ACESSO GLOBAL)</option>
                                {regionaisOptions.map(r => (
                                    <option key={r.id} value={r.id}>{r.nome}</option>
                                ))}
                            </select>
                            <p className="text-[8px] font-bold text-subtext mt-1 ml-1 uppercase opacity-60">
                                {isAdminRegional ? 'Usuários cadastrados ficam na sua regional.' : '* Obrigatório para Admin Regional. SuperAdmins ignoram este filtro.'}
                            </p>
                        </div>
                        <div>
                            <label className="label-saas ml-1">Vínculo com Evento</label>
                            <select
                                className="input-saas font-black uppercase text-[10px] h-12 bg-gray-50"
                                value={ensaioRegionalId}
                                onChange={e => setEnsaioRegionalId(e.target.value)}
                            >
                                <option value="">NENHUM VÍNCULO</option>
                                {eventos.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {editItem && editItem.ensaioRegionalId && (
                        <button
                            type="button"
                            onClick={handleDesvincular}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all border border-red-100"
                        >
                            <Link2Off size={16} /> Desvincular Usuário do Evento
                        </button>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={closeModal} className="w-full sm:flex-1 h-14 rounded-2xl text-subtext font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gray-50 transition-all">Cancelar</button>
                        <button type="submit" className="w-full sm:flex-1 btn-primary h-14 uppercase font-black tracking-[0.2em] text-[10px] shadow-xl shadow-blue-600/20">Salvar Mudanças</button>
                    </div>
                </form>
            </ModalBase>
        </div>
    )
}
