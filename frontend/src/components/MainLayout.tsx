
import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    ClipboardCheck,
    LayoutDashboard,
    BarChart3,
    UserCircle,
    LogOut,
    Music2,
    Settings,
    ChevronRight,
    CalendarDays,
    Users,
    Menu,
    X,
    MapPin,
    TrendingUp,
    Activity
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PWAInstallPrompt } from './PWAInstallPrompt'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const isAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_REGIONAL' || user?.role === 'ADMIN'
    const isSuperAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN'

    const adminMenu = [
        { title: 'Início', icon: LayoutDashboard, path: '/admin' },
        ...(isSuperAdmin ? [
            { title: 'Executivo', icon: TrendingUp, path: '/admin/executivo' },
            { title: 'BI Geral', icon: Activity, path: '/admin/bi' }
        ] : []),
        { title: 'Eventos', icon: CalendarDays, path: '/admin/eventos' },
        { title: 'Relatórios', icon: BarChart3, path: '/admin/relatorios' },
        { title: 'Usuários', icon: Users, path: '/admin/usuarios' },
        ...(isSuperAdmin ? [{ title: 'Regionais', icon: MapPin, path: '/admin/regionais' }] : []),
        { title: 'Ajustes', icon: Settings, path: '/admin/config' },
    ]

    const userMenu = [
        { title: 'Presença', icon: ClipboardCheck, path: '/presenca' },
        { title: 'Meu Perfil', icon: UserCircle, path: '/perfil' },
    ]

    const menuItems = isAdmin ? adminMenu : userMenu
    const isActive = (path: string) => {
        if (path === '/admin' && location.pathname === '/admin') return true
        if (path !== '/admin' && location.pathname.startsWith(path)) return true
        return false
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-bg flex font-inter overflow-x-hidden">
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Responsive) */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 shadow-sm z-[60] transition-transform duration-300 ease-in-out
                w-72 lg:w-80 flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isSidebarOpen ? 'block' : 'hidden md:flex'}
            `}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20">
                            <Music2 className="text-white" size={28} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-text text-xl tracking-tighter leading-none uppercase">Regional</span>
                            <span className="text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase">Música</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-subtext hover:bg-gray-50 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-4 flex-1 overflow-y-auto">
                    <p className="text-[10px] font-black text-subtext uppercase tracking-[0.2em] mb-4 ml-4 opacity-50">Menu Principal</p>
                    <nav className="space-y-1.5">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all ${isActive(item.path)
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-text'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-primary'} />
                                    <span className="text-sm tracking-tight">{item.title}</span>
                                </div>
                                <ChevronRight size={14} className={`transition-all ${isActive(item.path) ? 'opacity-40' : 'opacity-0 group-hover:opacity-40'}`} />
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                    <div className="bg-white rounded-2xl p-3 mb-4 flex items-center gap-3 border border-gray-100 shadow-sm">
                        <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600 font-black text-xs w-9 h-9 flex items-center justify-center">
                            {user?.name?.[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-black text-text truncate">{user?.name}</span>
                            <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{user?.role}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-4 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut size={16} />
                        Sair do Sistema
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden">
                {/* Header Mobile */}
                <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-[40]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-text hover:bg-gray-50 rounded-xl transition-all"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="font-black text-text text-xs tracking-tight uppercase leading-none">Regional</h1>
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Portal Administrativo</span>
                        </div>
                    </div>
                    <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                        {user?.name?.[0].toUpperCase()}
                    </div>
                </header>

                {/* Page Content */}
                <div className="px-0 md:p-8 lg:p-12 w-full max-w-7xl mx-auto flex-1">
                    <div className="animate-fade-in h-full">
                        {children}
                    </div>
                </div>

                {/* Bottom Navigation Mobile */}
                <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md border border-gray-100 h-16 rounded-[24px] flex items-center justify-around z-[45] shadow-2xl shadow-blue-900/10 px-4 ring-1 ring-black/5">
                    {menuItems.slice(0, 4).map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 transition-all ${isActive(item.path) ? 'text-blue-600 scale-110' : 'text-slate-300'
                                }`}
                        >
                            <item.icon size={20} strokeWidth={isActive(item.path) ? 3 : 2} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">{item.title}</span>
                        </Link>
                    ))}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex flex-col items-center gap-1 text-slate-300"
                    >
                        <Menu size={20} />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Mais</span>
                    </button>
                </nav>

                {/* Safe Area for Bottom Nav (Mobile) */}
                <div className="md:hidden h-28" />

                <PWAInstallPrompt />
            </main>
        </div>
    )
}
