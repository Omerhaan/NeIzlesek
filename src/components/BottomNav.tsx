import { Clapperboard, Film, User } from 'lucide-react'

export type NavTab = 'news' | 'match' | 'profile'

interface BottomNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  hasActiveRoom?: boolean
}

export function BottomNav({ activeTab, onTabChange, hasActiveRoom }: BottomNavProps) {
  return (
    <nav className="w-full max-w-md mx-auto px-6 py-2 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 flex items-center justify-between z-40 select-none pb-safe">
      {/* Sol Sekme: Haberler */}
      <button
        onClick={() => onTabChange('news')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-3 ${
          activeTab === 'news' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Clapperboard className="w-5 h-5" strokeWidth={activeTab === 'news' ? 2.5 : 1.8} />
        <span className="text-[10px] font-bold tracking-tight">Haberler</span>
      </button>

      {/* Orta Sekme: Neİzlesek (Öne çıkan eşleşme kartları) */}
      <button
        onClick={() => onTabChange('match')}
        className="relative -top-2 flex flex-col items-center transition-transform active:scale-95 cursor-pointer"
      >
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
            activeTab === 'match'
              ? 'bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-red-600/40 ring-4 ring-zinc-950'
              : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
          }`}
        >
          <Film className="w-6 h-6" strokeWidth={2.2} />
        </div>
        <span
          className={`text-[10px] font-black tracking-tight mt-0.5 ${
            activeTab === 'match' ? 'text-white' : 'text-zinc-500'
          }`}
        >
          Neİzlesek
        </span>
      </button>

      {/* Sağ Sekme: Hesabım / Oda */}
      <button
        onClick={() => onTabChange('profile')}
        className={`relative flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-3 ${
          activeTab === 'profile' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <div className="relative">
          <User className="w-5 h-5" strokeWidth={activeTab === 'profile' ? 2.5 : 1.8} />
          {hasActiveRoom && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-bold tracking-tight">Hesabım</span>
      </button>
    </nav>
  )
}
