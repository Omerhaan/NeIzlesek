import { useState } from 'react'
import { X, Copy, Check, Share2, QrCode } from 'lucide-react'
import { hapticLight } from '../utils/haptics'

interface RoomQRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  roomCode: string
  roomMode?: 'pair' | 'group'
}

export function RoomQRCodeModal({
  isOpen,
  onClose,
  roomCode,
  roomMode = 'pair',
}: RoomQRCodeModalProps) {
  const [copied, setCopied] = useState(false)
  if (!isOpen) return null

  const roomUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    roomUrl
  )}&bgcolor=18181b&color=ffffff&margin=12`

  const handleCopy = () => {
    hapticLight()
    navigator.clipboard.writeText(roomUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    hapticLight()
    const text = encodeURIComponent(
      roomMode === 'group'
        ? `🍿 Film Gecesi (Watch Party) Başlıyor! Katılmak için tıkla: ${roomUrl}\nOda Kodu: ${roomCode}`
        : `Bu akşam ne izlesek? Birlikte film seçmek için tıkla: ${roomUrl}\nOda Kodu: ${roomCode}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-white">QR Kod ile Katıl</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
          {roomMode === 'group'
            ? 'Arkadaşların telefon kamerasını bu koda tutarak hemen oylamaya katılabilir.'
            : 'Partnerin telefon kamerasını bu koda tutsun, anında odaya bağlansın.'}
        </p>

        {/* QR Code Frame */}
        <div className="my-5 p-3 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-xl relative group">
          <img
            src={qrImageUrl}
            alt={`Oda ${roomCode} QR Kodu`}
            className="w-52 h-52 rounded-xl object-contain"
            loading="eager"
          />
        </div>

        {/* Giant Room Code Display */}
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-2 px-4 mb-4 flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">Oda Kodu:</span>
          <span className="text-xl font-black font-mono tracking-widest text-amber-400">
            {roomCode}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopyalandı' : 'Linki Kopyala'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  )
}
