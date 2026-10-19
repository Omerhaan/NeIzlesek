import { useState, useEffect } from 'react'
import { X, Check, SlidersHorizontal, Star, Calendar, Tv, Film, RotateCcw } from 'lucide-react'
import {
  GENRES,
  POPULAR_PLATFORMS,
  type FilterState,
  type YearRange,
  DEFAULT_FILTERS,
} from '../services/tmdb'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: FilterState
  onApplyFilters: (filters: FilterState) => void
}

const YEAR_OPTIONS: { id: YearRange; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: '2020+', label: '2020 ve Sonrası' },
  { id: '2010s', label: '2010 - 2019' },
  { id: '2000s', label: '2000 - 2009' },
  { id: 'classic', label: '2000 Öncesi (Klasik)' },
]

const RATING_OPTIONS: { min: number; label: string }[] = [
  { min: 0, label: 'Tümü' },
  { min: 7.0, label: '7.0+' },
  { min: 7.5, label: '7.5+' },
  { min: 8.0, label: '8.0+ (Başyapıt)' },
]

export function FilterModal({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
}: FilterModalProps) {
  const [draft, setDraft] = useState<FilterState>(currentFilters)

  useEffect(() => {
    setDraft(currentFilters)
  }, [currentFilters, isOpen])

  if (!isOpen) return null

  const togglePlatform = (id: number) => {
    setDraft((prev) => {
      const exists = prev.platformIds.includes(id)
      const updated = exists
        ? prev.platformIds.filter((p) => p !== id)
        : [...prev.platformIds, id]
      return { ...prev, platformIds: updated }
    })
  }

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS)
  }

  const handleApply = () => {
    onApplyFilters(draft)
    onClose()
  }

  // Count active non-default filters
  const activeCount =
    (draft.genreId > 0 ? 1 : 0) +
    draft.platformIds.length +
    (draft.yearRange !== 'all' ? 1 : 0) +
    (draft.minRating > 0 ? 1 : 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-black text-white">Film Filtreleri</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 flex flex-col gap-5">
          {/* 1. Platforms (Streaming Providers) */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 mb-2.5">
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span>Yayın Platformları (Türkiye)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {POPULAR_PLATFORMS.map((plat) => {
                const isSelected = draft.platformIds.includes(plat.id)
                return (
                  <button
                    type="button"
                    key={plat.id}
                    onClick={() => togglePlatform(plat.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-red-600/90 text-white border-red-500 shadow-md shadow-red-600/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="truncate">{plat.name}</span>
                    {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Rating Filter */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 mb-2.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Minimum Puan (IMDb / TMDb)</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {RATING_OPTIONS.map((opt) => {
                const isSelected = draft.minRating === opt.min
                return (
                  <button
                    type="button"
                    key={opt.min}
                    onClick={() => setDraft((p) => ({ ...p, minRating: opt.min }))}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 font-black'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Year Range */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Yapım Yılı</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {YEAR_OPTIONS.map((y) => {
                const isSelected = draft.yearRange === y.id
                return (
                  <button
                    type="button"
                    key={y.id}
                    onClick={() => setDraft((p) => ({ ...p, yearRange: y.id }))}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-left flex items-center justify-between border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span>{y.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Film Genre */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 mb-2.5">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Film Türü</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {GENRES.map((g) => {
                const isSelected = draft.genreId === g.id
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setDraft((p) => ({ ...p, genreId: g.id }))}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20 font-bold'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {g.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-800 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sıfırla
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Filtreleri Uygula</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-red-600 text-[10px] font-black flex items-center justify-center ml-1">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
