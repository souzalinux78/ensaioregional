
import { useState } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { LoginCard } from '../components/LoginCard'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import './Login.css'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [blockedMessage, setBlockedMessage] = useState('')

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        setLoading(true)
        setError('')

        try {
            const { data } = await api.post('/auth/login', { email, password })
            const decoded: any = jwtDecode(data.accessToken)

            login(data.accessToken)

            if (decoded.role === 'ADMIN' || decoded.role === 'SUPERADMIN' || decoded.role === 'ADMIN_REGIONAL') {
                navigate('/admin')
            } else {
                navigate('/presenca')
            }

        } catch (err: any) {
            if (err.response?.status === 403) {
                setBlockedMessage(err.response?.data?.message || 'Você não está convocado para o evento ativo no momento.')
                setIsBlocked(true)
            } else {
                setError(err.response?.data?.message || 'E-mail ou senha incorretos.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (isBlocked) {
        return (
            <div className="login-container px-6 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-md w-full max-w-md p-10 rounded-[40px] shadow-2xl shadow-blue-900/10 border border-blue-50 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/10">
                        <ShieldAlert size={40} strokeWidth={2.5} />
                    </div>

                    <h2 className="text-2xl font-black text-text uppercase tracking-tighter mb-4 leading-none">
                        Acesso Restrito
                    </h2>

                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-8">
                        <p className="text-subtext font-bold text-sm leading-relaxed">
                            {blockedMessage}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsBlocked(false)}
                        className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                    >
                        <ArrowLeft size={18} /> Voltar ao Login
                    </button>

                    <p className="mt-8 text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-50">
                        Portal Regional de Música
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="login-container">
            <LoginCard
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
            />
        </div>
    )
}
