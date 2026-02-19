
import React, { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true)
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        setIsIOS(/iphone|ipad|ipod/.test(userAgent))

        // Capture event for Android/Desktop
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
        }
    }

    if (isStandalone) return null

    if (isIOS) {
        return (
            <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-sm text-blue-800 font-medium mb-2">Para instalar o App no iPhone:</p>
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                    <span>Toque em</span>
                    <Share size={16} className="text-blue-500" />
                    <span>e depois em <strong>"Adicionar à Tela de Início"</strong></span>
                </div>
            </div>
        )
    }

    if (!deferredPrompt) return null

    return (
        <button
            onClick={handleInstall}
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 animate-in zoom-in-50 duration-300"
        >
            <Download size={18} />
            INSTALAR APLICATIVO
        </button>
    )
}
