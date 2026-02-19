
import { useAuth } from '../context/AuthContext'
import { Shield, Mail, Calendar, MapPin } from 'lucide-react'

export function PerfilPage() {
    const { user } = useAuth()

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
                <div className="relative inline-block">
                    <div className="w-32 h-32 bg-primary rounded-[40px] shadow-2xl shadow-primary/30 flex items-center justify-center text-white text-5xl font-black">
                        {user?.name?.[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-gray-100 text-primary">
                        <Shield size={24} />
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-text tracking-tight uppercase">{user?.name}</h1>
                    <p className="text-primary-light font-black tracking-[0.2em] text-xs uppercase">{user?.role} INSTITUCIONAL</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="card-saas p-6 flex items-center gap-6">
                    <div className="bg-gray-50 p-4 rounded-2xl text-subtext">
                        <Mail size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-subtext uppercase tracking-widest mb-1">E-mail de Acesso</p>
                        <p className="font-bold text-text text-lg italic">Indisponível na sessão atual</p>
                    </div>
                </div>

                <div className="card-saas p-6 flex items-center gap-6 border-primary/10">
                    <div className="bg-primary/5 p-4 rounded-2xl text-primary">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Evento Vinculado</p>
                        <p className="font-bold text-text text-lg uppercase">{user?.ensaioRegionalNome || 'Nenhum vínculo ativo'}</p>
                    </div>
                </div>

                <div className="card-saas p-6 flex items-center gap-6">
                    <div className="bg-gray-50 p-4 rounded-2xl text-subtext">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-subtext uppercase tracking-widest mb-1">Localização</p>
                        <p className="font-bold text-text text-lg uppercase">Sessão Protegida</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-[32px] border border-dashed border-gray-200 text-center">
                <p className="text-xs font-bold text-subtext uppercase tracking-widest mb-2">Segurança da Informação</p>
                <p className="text-[10px] text-gray-400 leading-relaxed px-8">
                    Este é um acesso institucional restrito. Suas ações são monitoradas via Logs de Auditoria para garantir a integridade dos dados da secretaria.
                </p>
            </div>
        </div>
    )
}
