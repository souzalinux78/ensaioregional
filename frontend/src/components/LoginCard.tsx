
import React, { useState } from 'react'
import { Music2, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react'

interface LoginCardProps {
    email: string
    setEmail: (value: string) => void
    password: string
    setPassword: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    loading: boolean
    error: string
}

export function LoginCard({
    email,
    setEmail,
    password,
    setPassword,
    onSubmit,
    loading,
    error
}: LoginCardProps) {
    const [showPassword, setShowPassword] = useState(false)
    const isFormValid = email.length > 0 && password.length > 0

    return (
        <div className="w-full max-w-[420px] animate-fade-in">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-4 bg-primary rounded-[28px] shadow-xl shadow-primary/30 mb-6">
                    <Music2 size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-text tracking-tight uppercase">Eventos Musicais</h1>
                <p className="text-primary-light font-bold text-sm tracking-[0.2em]">SISTEMA DE PRESENÇA CCB</p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-2xl shadow-text/5 border border-gray-100">
                <form className="space-y-6" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <label className="label-saas ml-1" htmlFor="email">E-mail Corporativo</label>
                        <input
                            id="email"
                            type="email"
                            className="input-saas font-medium"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label-saas ml-1" htmlFor="password">Chave de Acesso</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="input-saas font-medium pr-12"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-subtext hover:text-primary transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="btn-primary w-full py-4 text-lg font-black tracking-wide flex items-center justify-center gap-3"
                            disabled={loading || !isFormValid}
                        >
                            {loading ? (
                                <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <><ShieldCheck size={22} /> ACESSAR PAINEL</>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-danger/5 border border-danger/10 text-danger rounded-2xl animate-in shake duration-500">
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="text-xs font-bold leading-tight">{error}</span>
                        </div>
                    )}
                </form>
            </div>

            <p className="mt-8 text-center text-[10px] text-subtext font-bold uppercase tracking-widest opacity-40">
                Acesso Restrito a Colaboradores Autorizados
            </p>
        </div>
    )
}
