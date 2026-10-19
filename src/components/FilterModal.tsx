import { X, Check, SlidersHorizontal } from 'lucide-react'
import { GENRES } from '../services/tmdb'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  selectedGenre: number
  onSelectGenre: (genreId: number) => void
}

export function FilterModal({
  isOpen,
  onClose,
  selectedGenre,
  onSelectGenre,
}: FilterModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-red-500" />
            <h3 className="text-base font-bold text-white">Film Türü Filtrele</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Genre Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {GENRES.map((g) => {
            const isSelected = selectedGenre === g.id
            return (
              <button
                key={g.id}
                onClick={() => {
                  onSelectGenre(g.id)
                  onClose()
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>{g.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            )
          })}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-zinc-500 text-center">
          Tür seçtiğinizde yeni 20 filmlik deste hemen hazırlanacaktır.
        </p>
      </div>
    </div>
  )
}
