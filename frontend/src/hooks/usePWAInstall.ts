
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true)
        }

        // Handle Android/Chrome prompt
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIPhone = userAgent.includes('iphone') || userAgent.includes('ipad')
        const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
        setIsIOS(isIPhone && isSafari && !isStandalone)

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [isStandalone])

    const installPWA = async () => {
        if (!deferredPrompt) return

        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsInstallable(false)
        }
    }

    return { isInstallable, isIOS, installPWA, isStandalone }
}
