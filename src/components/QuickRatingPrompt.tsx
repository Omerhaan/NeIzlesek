import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import type { Movie } from '../types'
import { hapticLight } from '../utils/haptics'

interface QuickRatingPromptProps {
  movie: Movie | null
  onRate: (movieId: number, rating: number) => void
  onDismiss: () => void
}

export function QuickRatingPrompt({
  movie,
  onRate,
  onDismiss,
}: QuickRatingPromptProps) {
  const [ratedScore, setRatedScore] = useState<number | null>(null)

  useEffect(() => {
    setRatedScore(null)
    if (!movie) return

    const timer = setTimeout(() => {
      onDismiss()
    }, 7000)

    return () => clearTimeout(timer)
  }, [movie, onDismiss])

  if (!movie) return null

  const handleSelect = (score: number) => {
    hapticLight()
    setRatedScore(score)
    onRate(movie.id, score)
    setTimeout(() => {
      onDismiss()
    }, 1200)
  }

  return (
    <div className="absolute bottom-20 inset-x-3 sm:inset-x-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
      <div className="bg-zinc-950/95 border border-purple-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-purple-400 text-xs">👁️</span>
            <span className="text-xs font-bold text-white truncate max-w-[200px]">
              {movie.title}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">izlendi! Puan ver:</span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="text-zinc-500 hover:text-white p-1 rounded-md text-xs cursor-pointer"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {ratedScore !== null ? (
          <div className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-emerald-400 animate-in zoom-in-95">
            <Check className="w-4 h-4" />
            <span>{ratedScore}/10 olarak kaydedildi! ⭐</span>
          </div>
        ) : (
          <div className="grid grid-cols-10 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => handleSelect(score)}
                className="py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-400/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 font-bold text-xs transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              >
                {score}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
