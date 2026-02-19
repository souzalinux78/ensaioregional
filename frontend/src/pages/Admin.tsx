
import { Routes, Route, Navigate } from 'react-router-dom'
import { EnsaiosTab } from './admin/tabs/EnsaiosTab'
import { CidadesTab } from './admin/tabs/CidadesTab'
import { InstrumentosTab } from './admin/tabs/InstrumentosTab'
import { UsersTab } from './admin/tabs/UsersTab'
import { RelatoriosTab } from './admin/tabs/RelatoriosTab'
import { DashboardTab } from './admin/tabs/DashboardTab'
import { MapPin, Music } from 'lucide-react'
import { useState } from 'react'

function ConfigTabs() {
    const [subTab, setSubTab] = useState<'cidades' | 'instrumentos'>('cidades')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-text tracking-tight uppercase">Configurações do Sistema</h1>
                <p className="text-sm text-subtext font-medium uppercase tracking-widest opacity-70">Gerenciamento de tabelas auxiliares</p>
            </div>

            {/* Sub-tabs with horizontal scroll on mobile */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 no-scrollbar">
                <button
                    onClick={() => setSubTab('cidades')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex-shrink-0 ${subTab === 'cidades' ? 'bg-white text-primary shadow-sm' : 'text-subtext hover:bg-white/50'
                        }`}
                >
                    <MapPin size={16} /> Cidades
                </button>
                <button
                    onClick={() => setSubTab('instrumentos')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex-shrink-0 ${subTab === 'instrumentos' ? 'bg-white text-primary shadow-sm' : 'text-subtext hover:bg-white/50'
                        }`}
                >
                    <Music size={16} /> Instrumentos
                </button>
            </div>

            <div className="animate-fade-in">
                {subTab === 'cidades' ? <CidadesTab /> : <InstrumentosTab />}
            </div>
        </div>
    )
}

export function AdminPage() {
    return (
        <Routes>
            <Route path="/" element={<DashboardTab />} />
            <Route path="/eventos" element={<EnsaiosTab />} />
            <Route path="/relatorios" element={<RelatoriosTab />} />
            <Route path="/usuarios" element={<UsersTab />} />
            <Route path="/config" element={<ConfigTabs />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    )
}
