import { useState, useEffect, useRef } from 'react'
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
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  // Auto-dismiss reliably after 4.5 seconds without being interrupted by parent re-renders
  useEffect(() => {
    setRatedScore(null)
    if (!movie) return

    const timer = setTimeout(() => {
      onDismissRef.current()
    }, 4500)

    return () => clearTimeout(timer)
  }, [movie?.id])

  if (!movie) return null

  const handleSelect = (score: number) => {
    hapticLight()
    setRatedScore(score)
    onRate(movie.id, score)
    setTimeout(() => {
      onDismissRef.current()
    }, 700)
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
      <div className="bg-zinc-950/95 border border-purple-500/40 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-purple-400 text-xs">👁️</span>
            <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[180px]">
              {movie.title}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">için puanın:</span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="text-zinc-500 hover:text-white p-1 rounded-md text-xs cursor-pointer transition-colors"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {ratedScore !== null ? (
          <div className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-emerald-400 animate-in zoom-in-95">
            <Check className="w-4 h-4" />
            <span>{ratedScore}/10 kaydedildi ⭐</span>
          </div>
        ) : (
          <div className="grid grid-cols-10 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => handleSelect(score)}
                className="py-1 rounded-md bg-zinc-900 hover:bg-amber-400/20 text-zinc-300 hover:text-amber-300 border border-zinc-800 font-bold text-xs transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              >
                {score}
              </button>
            ))}
          </div>
        )}

        {/* Subtle Auto-Dismiss Countdown Bar */}
        {ratedScore === null && (
          <div className="h-0.5 bg-zinc-900 rounded-full overflow-hidden mt-0.5">
            <div className="h-full bg-purple-500/60 rounded-full animate-shrink-width" />
          </div>
        )}
      </div>
    </div>
  )
}
