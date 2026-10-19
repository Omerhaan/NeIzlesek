import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Heart, Eye, Star, RotateCcw, Sparkles } from 'lucide-react'
import type { Movie, SwipeAction } from '../types'
import { MovieCard } from './MovieCard'

interface SwipeDeckProps {
  movies: Movie[]
  onSwipe: (movie: Movie, action: SwipeAction) => void
  onLoadMore: () => void
  isLoading: boolean
}

export function SwipeDeck({ movies, onSwipe, onLoadMore, isLoading }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const startPos = useRef({ x: 0, y: 0 })
  const isPointerDown = useRef(false)

  // Trigger load more when fewer than 4 cards remain
  useEffect(() => {
    if (movies.length - currentIndex < 4 && !isLoading) {
      onLoadMore()
    }
  }, [currentIndex, movies.length, isLoading, onLoadMore])

  const triggerSwipe = useCallback(
    (action: SwipeAction) => {
      const currentMovie = movies[currentIndex]
      if (!currentMovie) return

      let anim: 'left' | 'right' | 'up' = 'right'
      if (action === 'pass') anim = 'left'
      if (action === 'superlike') anim = 'up'

      // Set target offset for exit animation
      if (anim === 'left') setDragOffset({ x: -window.innerWidth - 100, y: 0 })
      else if (anim === 'right') setDragOffset({ x: window.innerWidth + 100, y: 0 })
      else if (anim === 'up') setDragOffset({ x: 0, y: -window.innerHeight })

      setTimeout(() => {
        onSwipe(currentMovie, action)
        setCurrentIndex((prev) => prev + 1)
        setDragOffset({ x: 0, y: 0 })
      }, 250)
    },
    [currentIndex, movies, onSwipe]
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
    } else if (dragOffset.y < -threshold * 1.5) {
      triggerSwipe('superlike')
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Current and next card
  const currentMovie = movies[currentIndex]
  const nextMovie = movies[currentIndex + 1]

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
        <button
          onClick={onLoadMore}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-lg shadow-red-600/30 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Yeniden Dene
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between px-4 pb-6 overflow-hidden">
      {/* Card Stack Area */}
      <div
        className="relative flex-1 w-full my-2 touch-none select-none"
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

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-center gap-4 py-2 z-30">
        {/* Pass Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('pass')}
          className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
          title="Pas (Geç)"
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
        </button>

        {/* Watched Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('watched')}
          className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
          title="İzledim"
        >
          <Eye className="w-5 h-5" strokeWidth={2.2} />
        </button>

        {/* Superlike Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('superlike')}
          className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-sky-500/40 text-sky-400 hover:bg-sky-500/10 hover:border-sky-400 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
          title="Süper Beğeni"
        >
          <Star className="w-5 h-5 fill-sky-400 text-sky-400" />
        </button>

        {/* Like Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('like')}
          className="w-14 h-14 rounded-full bg-zinc-900 border-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer shadow-emerald-500/20"
          title="Beğen"
        >
          <Heart className="w-7 h-7 fill-emerald-400 text-emerald-400" />
        </button>
      </div>
    </div>
  )
}
