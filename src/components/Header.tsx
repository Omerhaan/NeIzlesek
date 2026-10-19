import { Film, LogOut, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  roomCode?: string | null
  onLeaveRoom?: () => void
}

export function Header({ roomCode, onLeaveRoom }: HeaderProps) {
  const [copied, setCopied] = useState(false)

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

      {roomCode && (
        <div className="flex items-center gap-2">
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
    </header>
  )
}
