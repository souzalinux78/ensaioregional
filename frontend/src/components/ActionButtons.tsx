
import { Edit, Trash2 } from 'lucide-react'

interface ActionButtonsProps {
    onEdit: () => void
    onDelete: () => void
    editLabel?: string
    deleteLabel?: string
}

export function ActionButtons({ onEdit, onDelete }: ActionButtonsProps) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors group"
                title="Editar"
            >
                <Edit size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase hidden sm:inline">Editar</span>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                }}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors group"
                title="Excluir"
            >
                <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase hidden sm:inline">Excluir</span>
            </button>
        </div>
    )
}
