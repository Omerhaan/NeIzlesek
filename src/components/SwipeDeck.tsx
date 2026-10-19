import { useState, useRef, useCallback } from 'react'
import { X, Heart, Eye, RotateCcw, Sparkles } from 'lucide-react'
import type { Movie, SwipeAction } from '../types'
import { MovieCard } from './MovieCard'

interface SwipeDeckProps {
  movies: Movie[]
  onSwipe: (movie: Movie, action: SwipeAction) => void
  onLoadNextRound: () => void
  onResetGenre?: () => void
  isLoading: boolean
  roundNumber?: number
  roundLimit?: number
}

export function SwipeDeck({
  movies,
  onSwipe,
  onLoadNextRound,
  onResetGenre,
  isLoading,
  roundNumber = 1,
  roundLimit = 20,
}: SwipeDeckProps) {
  const [roundIndex, setRoundIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const startPos = useRef({ x: 0, y: 0 })
  const isPointerDown = useRef(false)

  const triggerSwipe = useCallback(
    (action: SwipeAction) => {
      const currentMovie = movies[roundIndex]
      if (!currentMovie) return

      const anim = action === 'pass' ? 'left' : 'right'

      // Set target offset for exit animation
      if (anim === 'left') {
        setDragOffset({ x: -window.innerWidth - 100, y: 0 })
      } else {
        setDragOffset({ x: window.innerWidth + 100, y: 0 })
      }

      setTimeout(() => {
        onSwipe(currentMovie, action)
        setRoundIndex((prev) => prev + 1)
        setDragOffset({ x: 0, y: 0 })
      }, 250)
    },
    [roundIndex, movies, onSwipe]
  )

  // Touch & Mouse Handlers
  const handleStart = (clientX: number, clientY: number) => {
    isPointerDown.current = true
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isPointerDown.current) return
    const dx = clientX - startPos.current.x
    const dy = clientY - startPos.current.y
    setDragOffset({ x: dx, y: dy })
  }

  const handleEnd = () => {
    if (!isPointerDown.current) return
    isPointerDown.current = false
    setIsDragging(false)

    const threshold = 100
    if (dragOffset.x > threshold) {
      triggerSwipe('like')
    } else if (dragOffset.x < -threshold) {
      triggerSwipe('pass')
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Check if round limit reached
  const isRoundComplete = roundIndex >= roundLimit || (movies.length > 0 && roundIndex >= movies.length)

  if (isRoundComplete) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5 text-amber-400 shadow-xl shadow-amber-400/10">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 mb-3">
          {roundNumber}. Tur Tamamlandı
        </div>
        <h3 className="text-2xl font-black text-white mb-2">Henüz Eşleşme Yok</h3>
        <p className="text-sm text-zinc-400 max-w-xs mb-8 leading-relaxed">
          Bu turdaki {roundLimit} filmi tamamladınız. Partnerinizle ortak bir filmde buluşmak için yeni bir tur başlatabilirsiniz!
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              setRoundIndex(0)
              onLoadNextRound()
            }}
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {isLoading ? 'Filmler Hazırlanıyor...' : `${roundNumber + 1}. Tura Başla (Yeni ${roundLimit} Film)`}
          </button>

          {onResetGenre && (
            <button
              onClick={onResetGenre}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-sm rounded-2xl transition-colors cursor-pointer border border-zinc-800"
            >
              Farklı Kategori Seç
            </button>
          )}
        </div>
      </div>
    )
  }

  // Current and next card
  const currentMovie = movies[roundIndex]
  const nextMovie = movies[roundIndex + 1]

  if (!currentMovie) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Filmler Yükleniyor</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Seçtiğiniz kriterlere uygun filmler hazırlanıyor...
        </p>
      </div>
    )
  }

  const currentCount = Math.min(roundIndex + 1, roundLimit)
  const progressPercent = Math.min(100, (roundIndex / roundLimit) * 100)

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between px-4 pb-4 overflow-hidden">
      {/* Top Round Progress Bar */}
      <div className="w-full py-2 flex flex-col gap-1.5 z-10">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
          <span className="text-zinc-500 font-medium">Tur {roundNumber}</span>
          <span className="text-white font-mono">{currentCount} / {roundLimit}</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Card Stack Area */}
      <div
        className="relative flex-1 w-full my-1 touch-none select-none"
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {/* Next Card in Stack */}
        {nextMovie && (
          <MovieCard
            key={nextMovie.id}
            movie={nextMovie}
            isTopCard={false}
            dragOffset={{ x: 0, y: 0 }}
            isDragging={false}
          />
        )}

        {/* Current Top Card */}
        <MovieCard
          key={currentMovie.id}
          movie={currentMovie}
          isTopCard={true}
          dragOffset={dragOffset}
          isDragging={isDragging}
        />
      </div>

      {/* Centered 3 Action Buttons Toolbar */}
      <div className="flex items-center justify-center gap-6 py-2 z-30">
        {/* Pass Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('pass')}
          className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-rose-500/50 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
          title="Pas (Geç)"
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
        </button>

        {/* Watched Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('watched')}
          className="w-13 h-13 rounded-full bg-zinc-900 border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
          title="İzledim"
        >
          <Eye className="w-6 h-6" strokeWidth={2.2} />
        </button>

        {/* Like Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('like')}
          className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer shadow-emerald-500/20"
          title="Beğen"
        >
          <Heart className="w-7 h-7 fill-emerald-400 text-emerald-400" />
        </button>
      </div>
    </div>
  )
}
