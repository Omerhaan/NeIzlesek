import { Film, LogOut, Copy, Check, SlidersHorizontal, ChevronDown, Search, Volume2, VolumeX, Dices } from 'lucide-react'
import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../utils/audio'

interface HeaderProps {
  roomCode?: string | null
  onLeaveRoom?: () => void
  onOpenFilter?: () => void
  onOpenSearch?: () => void
  onOpenRoulette?: () => void
  selectedGenreName?: string
  activeFilterCount?: number
}

export function Header({
  roomCode,
  onLeaveRoom,
  onOpenFilter,
  onOpenSearch,
  onOpenRoulette,
  selectedGenreName,
  activeFilterCount = 0,
}: HeaderProps) {
  const [copied, setCopied] = useState(false)
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
  }

  const copyCode = () => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="w-full max-w-md mx-auto px-4 py-3 flex items-center justify-between z-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
          <Film className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
          Neİzlesek
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Sound FX Toggle Button */}
        <button
          type="button"
          onClick={toggleSound}
          className={`p-2 rounded-full border transition-colors cursor-pointer ${
            soundOn
              ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
              : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-500 hover:text-zinc-400'
          }`}
          title={soundOn ? 'Ses Efektleri Açık (Kapatmak için tıkla)' : 'Ses Efektleri Kapalı (Açmak için tıkla)'}
          aria-label={soundOn ? 'Sesi Kapat' : 'Sesi Aç'}
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Film Ruleti Button */}
        {onOpenRoulette && (
          <button
            type="button"
            onClick={onOpenRoulette}
            className="p-2 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 rounded-full transition-colors cursor-pointer"
            title="Film Ruleti (Kararsızım, Sen Seç!)"
            aria-label="Film Ruleti"
          >
            <Dices className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Global Search Button */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-full transition-colors cursor-pointer"
            title="Film Ara & Listene Ekle"
            aria-label="Film Ara"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Compact Filter Button */}
        {onOpenFilter && (
          <button
            onClick={onOpenFilter}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            title="Film Filtreleri"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
            <span className="max-w-[70px] truncate">{selectedGenreName || 'Filtrele'}</span>
            {activeFilterCount > 0 ? (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            )}
          </button>
        )}

        {/* Room Code Badge */}
        {roomCode && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 rounded-full text-xs font-mono text-zinc-300 transition-colors cursor-pointer"
              title="Oda kodunu kopyala"
            >
              <span>Oda: <strong className="text-white">{roomCode}</strong></span>
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            </button>

            {onLeaveRoom && (
              <button
                onClick={onLeaveRoom}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 rounded-full transition-colors cursor-pointer"
                title="Odadan Ayrıl"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
