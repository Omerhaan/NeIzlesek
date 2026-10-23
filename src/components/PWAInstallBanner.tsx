import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'
import { hapticLight } from '../utils/haptics'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // Check if already running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) return

    // Check if previously dismissed in this session
    if (sessionStorage.getItem('neizlesek_pwa_dismissed') === 'true') return

    // Android / Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios')

    if (isIosDevice && isSafari && !isStandalone) {
      setIsIos(true)
      // Only show iOS banner after a short delay so user sees app first
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 4000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    hapticLight()
    if (isIos) {
      setShowIosGuide((prev) => !prev)
      return
    }

    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsVisible(false)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.warn('PWA install prompt error:', err)
    }
  }

  const handleDismiss = () => {
    hapticLight()
    setIsVisible(false)
    sessionStorage.setItem('neizlesek_pwa_dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:max-w-sm z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
            <Download className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white leading-tight truncate">
              Neİzlesek'i Uygulama Olarak Yükle
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              Tarayıcı çubuğunu kaldır, tam ekran mobil deneyime geç.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button & iOS Guide */}
        {showIosGuide ? (
          <div className="bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-[11px] text-zinc-300 flex items-center gap-2">
            <Share className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Safari alt çubuğundaki <strong>Paylaş</strong> simgesine dokunun ve <strong>"Ana Ekrana Ekle"</strong>yi seçin.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIos ? 'Nasıl Yüklenir?' : 'Uygulamayı Yükle'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Daha Sonra
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
