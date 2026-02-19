
import { useState, useEffect } from 'react'
import { AdminService, Instrumento } from '../../../services/admin.service'
import { Upload, Plus, CheckCircle, Music } from 'lucide-react'
import { ModalBase } from '../../../components/ModalBase'
import { ActionButtons } from '../../../components/ActionButtons'

export function InstrumentosTab() {
    const [items, setItems] = useState<Instrumento[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [importModalOpen, setImportModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<Instrumento | null>(null)
    const [nome, setNome] = useState('')
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importResult, setImportResult] = useState<any>(null)

    const fetchItems = async () => {
        try {
            const res = await AdminService.getInstrumentos()
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
            if (editItem) {
                await AdminService.updateInstrumento(editItem.id, nome)
            } else {
                await AdminService.createInstrumento(nome)
            }
            fetchItems()
            closeModal()
        } catch (e) {
            alert('Erro ao salvar')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir instrumento?')) return
        try {
            await AdminService.deleteInstrumento(id)
            fetchItems()
        } catch (e) {
            alert('Erro ao excluir')
        }
    }

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!importFile) return
        try {
            const res = await AdminService.importInstrumentos(importFile)
            setImportResult(res.data)
            fetchItems()
        } catch (e) {
            alert('Erro na importação')
        }
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditItem(null)
        setNome('')
    }

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-text uppercase tracking-tight leading-none">Vozes e Instrumentos</h2>
                    <p className="text-xs text-subtext mt-1 uppercase tracking-widest font-bold opacity-60">Padronização da Nomenclatura Oficial</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setImportModalOpen(true)} className="flex-1 sm:flex-none h-12 px-6 rounded-xl border border-gray-200 font-black text-[10px] uppercase tracking-widest text-subtext hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
                        <Upload size={18} /> Importar Base
                    </button>
                    <button onClick={() => { setEditItem(null); setNome(''); setModalOpen(true) }} className="btn-primary h-12 flex items-center justify-center gap-2 flex-1 sm:flex-none uppercase font-black text-[10px] tracking-widest">
                        <Plus size={18} /> Novo Cargo
                    </button>
                </div>
            </div>

            <div className="card-saas p-0 overflow-hidden border-none shadow-xl bg-white rounded-[32px]">
                <div className="overflow-x-auto">
                    <table className="table-saas">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="pl-8">Instrumento / Categoria</th>
                                <th className="text-right pr-8">Controle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(items ?? []).map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/30 transition-all">
                                    <td className="pl-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                                <Music size={16} />
                                            </div>
                                            <span className="font-black text-text uppercase text-xs tracking-tight">{item.nome}</span>
                                        </div>
                                    </td>
                                    <td className="pr-8 text-right">
                                        <div className="flex justify-end">
                                            <ActionButtons
                                                onEdit={() => { setEditItem(item); setNome(item.nome); setModalOpen(true) }}
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
            <ModalBase isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Editar Instrumento' : 'Registrar Instrumento'} maxWidth="max-w-md">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="label-saas ml-1">Nome do Instrumento</label>
                        <input
                            className="input-saas uppercase font-black h-12"
                            value={nome}
                            onChange={e => setNome(e.target.value.toUpperCase())}
                            required
                            placeholder="EX: VIOLINISTA"
                        />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={closeModal} className="flex-1 h-12 rounded-xl text-subtext font-black uppercase text-[10px] tracking-widest hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="flex-1 btn-primary h-12 uppercase font-black tracking-widest text-[10px]">Confirmar</button>
                    </div>
                </form>
            </ModalBase>

            {/* Modal Import */}
            <ModalBase isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Importar Instrumentos" maxWidth="max-w-md">
                {!importResult ? (
                    <form onSubmit={handleImport} className="space-y-6">
                        <div className="p-10 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center text-center group hover:border-primary/20 transition-all">
                            <div className="p-4 bg-primary/5 rounded-full text-primary mb-4 group-hover:scale-110 transition-transform">
                                <Upload size={32} />
                            </div>
                            <p className="text-[10px] font-black text-subtext uppercase tracking-widest">Arraste ou selecione o arquivo .CSV</p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={e => setImportFile(e.target.files?.[0] || null)}
                                className="mt-6 text-[10px] font-black w-full"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary w-full h-14 uppercase font-black tracking-[0.2em] text-xs">Processar Base</button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-green-50 p-6 rounded-[24px] flex flex-col items-center gap-3 text-green-700 text-center border border-green-100">
                            <CheckCircle size={40} strokeWidth={3} />
                            <span className="font-black text-xs uppercase tracking-widest leading-none">Processamento Concluído</span>
                        </div>
                        <div className="space-y-3 px-2">
                            <div className="flex justify-between p-4 bg-gray-50 rounded-xl"><span className="text-[10px] font-black uppercase text-subtext">Total Processado</span> <b className="text-text">{importResult.totalProcessados}</b></div>
                            <div className="flex justify-between p-4 bg-green-50/50 rounded-xl text-green-700"><span className="text-[10px] font-black uppercase">Novos Registros</span> <b>{importResult.inseridos}</b></div>
                            <div className="flex justify-between p-4 bg-gray-50 rounded-xl text-slate-400"><span className="text-[10px] font-black uppercase">Duplicados</span> <b>{importResult.ignorados}</b></div>
                        </div>
                        <button onClick={() => { setImportResult(null); setImportModalOpen(false) }} className="btn-primary w-full h-14 uppercase font-black text-xs tracking-widest shadow-xl shadow-primary/20">Continuar</button>
                    </div>
                )}
            </ModalBase>
        </div>
    )
}
