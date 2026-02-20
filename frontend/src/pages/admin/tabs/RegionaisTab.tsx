
import { useState, useEffect } from 'react'
import { AdminService, Regional } from '../../../services/admin.service'
import { Plus, MapPin } from 'lucide-react'
import { ModalBase } from '../../../components/ModalBase'
import { ActionButtons } from '../../../components/ActionButtons'

export function RegionaisTab() {
    const [items, setItems] = useState<Regional[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<Regional | null>(null)

    // Form State
    const [nome, setNome] = useState('')
    const [setor, setSetor] = useState('')
    const [ativo, setAtivo] = useState(true)

    const fetchItems = async () => {
        try {
            const res = await AdminService.getRegionais()
            setItems(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const data = {
                nome: nome.toUpperCase(),
                setor: setor.toUpperCase(),
                ativo
            }
            if (editItem) {
                await AdminService.updateRegional(editItem.id, data)
            } else {
                await AdminService.createRegional(data)
            }
            fetchItems()
            closeModal()
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao salvar')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir regional?')) return
        try {
            await AdminService.deleteRegional(id)
            fetchItems()
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao excluir')
        }
    }

    const openModal = (item?: Regional) => {
        if (item) {
            setEditItem(item)
            setNome(item.nome)
            setSetor(item.setor || '')
            setAtivo(item.ativo)
        } else {
            setEditItem(null)
            setNome('')
            setSetor('')
            setAtivo(true)
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
                    <h2 className="text-xl font-bold text-text uppercase tracking-tight leading-none">Regionais</h2>
                    <p className="text-xs text-subtext mt-1 uppercase tracking-widest font-bold opacity-60">Gerenciamento de Divisões Geográficas</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary h-12 flex items-center justify-center gap-2 w-full sm:w-auto uppercase font-black text-[10px] tracking-widest">
                    <Plus size={18} /> Nova Regional
                </button>
            </div>

            <div className="card-saas p-0 overflow-hidden border-none shadow-xl bg-white rounded-[32px]">
                <div className="overflow-x-auto">
                    <table className="table-saas">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="pl-8">Nome / Setor</th>
                                <th>Status</th>
                                <th className="text-right pr-8">Controle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(items ?? []).map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/30 transition-all">
                                    <td className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-text uppercase text-xs tracking-tight">{item.nome}</span>
                                                <span className="text-[10px] text-subtext uppercase font-bold opacity-70">{item.setor || 'Sede'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full w-fit ${item.ativo ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.ativo ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {item.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
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

            {/* Modal CRUD */}
            <ModalBase isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Editar Regional' : 'Cadastrar Regional'} maxWidth="max-w-md">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="label-saas ml-1 uppercase text-[10px] font-black tracking-widest">Nome da Regional</label>
                        <input
                            className="input-saas uppercase font-black h-12"
                            value={nome}
                            onChange={e => setNome(e.target.value.toUpperCase())}
                            required
                            placeholder="EX: ATIBAIA"
                        />
                    </div>
                    <div>
                        <label className="label-saas ml-1 uppercase text-[10px] font-black tracking-widest">Setor / Região</label>
                        <input
                            className="input-saas uppercase font-black h-12"
                            value={setor}
                            onChange={e => setSetor(e.target.value.toUpperCase())}
                            placeholder="EX: SEDE / NORDESTE"
                        />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ativo}
                                onChange={e => setAtivo(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-[10px] font-black text-text uppercase tracking-widest">Regional Ativa</span>
                        </label>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={closeModal} className="flex-1 h-12 rounded-xl text-subtext font-black uppercase text-[10px] tracking-widest hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="flex-1 btn-primary h-12 uppercase font-black tracking-widest text-[10px]">Salvar Regional</button>
                    </div>
                </form>
            </ModalBase>
        </div>
    )
}
