
import { usePWAInstall } from '../hooks/usePWAInstall'
import { Download, X, Share } from 'lucide-react'

export function PWAInstallPrompt() {
    const { isInstallable, isIOS, installPWA, isStandalone } = usePWAInstall()

    if (isStandalone) return null

    return (
        <>
            {/* Android/Chrome Prompt */}
            {isInstallable && (
                <div className="fixed bottom-28 left-6 right-6 bg-primary text-white p-4 rounded-3xl shadow-2xl z-[100] animate-in slide-in-from-bottom duration-500 flex items-center justify-between gap-4 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Download size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight">Instalar Aplicativo</p>
                            <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Acesso rápido e offline</p>
                        </div>
                    </div>
                    <button
                        onClick={installPWA}
                        className="bg-white text-primary px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                    >
                        Instalar
                    </button>
                </div>
            )}

            {/* iOS Help Prompt */}
            {isIOS && (
                <div className="fixed bottom-28 left-6 right-6 bg-white p-6 rounded-[32px] shadow-2xl z-[100] animate-in slide-in-from-bottom duration-500 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl text-primary">
                                <Download size={20} />
                            </div>
                            <p className="text-sm font-black text-text uppercase tracking-tight">Instalar no iPhone</p>
                        </div>
                        <button className="text-subtext"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <p className="text-xs font-medium text-subtext leading-relaxed">
                            Para instalar este aplicativo no seu iOS, siga as instruções abaixo:
                        </p>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                            <div className="flex flex-col items-center gap-1">
                                <Share size={20} className="text-primary" />
                                <span className="text-[8px] font-black uppercase text-primary">Compartilhar</span>
                            </div>
                            <div className="h-8 w-px bg-gray-200" />
                            <p className="text-[10px] font-bold text-text uppercase tracking-wide">
                                Toque em "Compartilhar" e depois em "Adicionar à Tela de Início"
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
