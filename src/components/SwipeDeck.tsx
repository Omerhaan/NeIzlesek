import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Heart, Eye, RotateCcw, Sparkles, Ban, Trophy, Users } from 'lucide-react'
import type { Movie, SwipeAction } from '../types'
import { IMAGE_BASE_URL } from '../services/tmdb'
import { MovieCard } from './MovieCard'

interface SwipeDeckProps {
  movies: Movie[]
  onSwipe: (movie: Movie, action: SwipeAction) => void
  onLoadNextRound: () => void
  onRoundComplete?: () => void
  onResetGenre?: () => void
  isLoading: boolean
  roundNumber?: number
  roundLimit?: number
  hasRoundLimit?: boolean
  isRoomMode?: boolean
  totalSwipesCount?: number
  onOpenDetails?: (movie: Movie) => void
  onOpenFallback?: () => void
  partnerSwipesCount?: number
  initialIndex?: number
}

export function SwipeDeck({
  movies,
  onSwipe,
  onLoadNextRound,
  onRoundComplete,
  onResetGenre,
  isLoading,
  roundNumber = 1,
  roundLimit = 25,
  hasRoundLimit = true,
  isRoomMode = false,
  totalSwipesCount = 0,
  onOpenDetails,
  onOpenFallback,
  partnerSwipesCount,
  initialIndex = 0,
}: SwipeDeckProps) {
  const [roundIndex, setRoundIndex] = useState(initialIndex)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [remainingVetoes, setRemainingVetoes] = useState(3)

  const startPos = useRef({ x: 0, y: 0 })
  const isPointerDown = useRef(false)
  const swipeInProgress = useRef(false)

  useEffect(() => {
    swipeInProgress.current = false
  }, [roundIndex])

  // Sync initialIndex if updated externally
  useEffect(() => {
    if (initialIndex > 0) {
      setRoundIndex((prev) => Math.max(prev, initialIndex))
    }
  }, [initialIndex])

  // Reset veto count each round
  useEffect(() => {
    setRemainingVetoes(3)
  }, [roundNumber])

  // Calculate actual round limit based on available movies
  const effectiveLimit = hasRoundLimit
    ? movies.length > 0
      ? Math.min(roundLimit, movies.length)
      : roundLimit
    : roundLimit

  // In infinite mode (no round limit), auto-load more movies when nearing end
  useEffect(() => {
    if (!hasRoundLimit && movies.length - roundIndex < 4 && !isLoading) {
      onLoadNextRound()
    }
  }, [hasRoundLimit, movies.length, roundIndex, isLoading, onLoadNextRound])

  // Preload upcoming movie posters in memory for instant card rendering
  useEffect(() => {
    if (!movies || movies.length === 0) return
    const nextMovies = movies.slice(roundIndex, roundIndex + 4)
    nextMovies.forEach((m) => {
      if (m.poster_path) {
        const img = new Image()
        img.src = `${IMAGE_BASE_URL}${m.poster_path}`
      }
    })
  }, [roundIndex, movies])

  const triggerSwipe = useCallback(
    (action: SwipeAction) => {
      const currentMovie = movies[roundIndex]
      if (!currentMovie || swipeInProgress.current) return
      swipeInProgress.current = true

      // Set target offset for exit animation
      if (action === 'pass') {
        setDragOffset({ x: -window.innerWidth - 100, y: 0 })
      } else if (action === 'like') {
        setDragOffset({ x: window.innerWidth + 100, y: 0 })
      } else if (action === 'veto') {
        setDragOffset({ x: 0, y: window.innerHeight + 100 })
      } else {
        // watched
        setDragOffset({ x: 0, y: -window.innerHeight - 100 })
      }

      setTimeout(() => {
        onSwipe(currentMovie, action)
        setRoundIndex((prev) => prev + 1)
        setDragOffset({ x: 0, y: 0 })
      }, 250)
    },
    [roundIndex, movies, onSwipe]
  )

  const handleVetoClick = useCallback(() => {
    if (remainingVetoes <= 0) return
    setRemainingVetoes((prev) => Math.max(0, prev - 1))
    triggerSwipe('veto')
  }, [remainingVetoes, triggerSwipe])

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }

      if ((hasRoundLimit && roundIndex >= roundLimit) || !movies[roundIndex]) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        triggerSwipe('pass')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        triggerSwipe('like')
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        triggerSwipe('watched')
      } else if (e.key.toLowerCase() === 'v' && isRoomMode) {
        e.preventDefault()
        handleVetoClick()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerSwipe, handleVetoClick, roundIndex, roundLimit, hasRoundLimit, movies, isRoomMode])

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

    const thresholdX = window.innerWidth * 0.25
    const thresholdY = window.innerHeight * 0.2

    if (dragOffset.x > thresholdX) {
      triggerSwipe('like')
    } else if (dragOffset.x < -thresholdX) {
      triggerSwipe('pass')
    } else if (dragOffset.y > thresholdY && isRoomMode && remainingVetoes > 0) {
      handleVetoClick()
    } else if (dragOffset.y < -thresholdY) {
      triggerSwipe('watched')
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Automatically trigger fallback voting modal when both users finish and no direct match occurred
  useEffect(() => {
    if (
      isRoomMode &&
      hasRoundLimit &&
      movies.length > 0 &&
      roundIndex >= effectiveLimit &&
      (partnerSwipesCount ?? 0) >= effectiveLimit &&
      onOpenFallback
    ) {
      const timer = setTimeout(() => {
        onOpenFallback()
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isRoomMode, hasRoundLimit, movies.length, roundIndex, effectiveLimit, partnerSwipesCount, onOpenFallback])

  // End of Round (25 Movies Limit or end of curated deck) in Room Mode
  if (hasRoundLimit && movies.length > 0 && roundIndex >= effectiveLimit) {
    onRoundComplete?.()

    // If in room mode and partner hasn't finished all movies yet, show live waiting screen
    if (isRoomMode && partnerSwipesCount !== undefined && partnerSwipesCount < effectiveLimit) {
      return (
        <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Users className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-white mb-1.5">Harika! {effectiveLimit} Filmi İnceledin</h3>
          <p className="text-xs text-zinc-400 mb-6 max-w-xs leading-relaxed">
            Seçimlerin kaydedildi. Partnerinin de turunu tamamlaması bekleniyor...
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full max-w-xs mb-4 flex items-center justify-between shadow-md">
            <span className="text-xs text-zinc-400 font-medium">Partnerinin İlerlemesi:</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {partnerSwipesCount} / {effectiveLimit} Film
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Her iki taraf da bitirdiğinde sonuçlar açılacak</span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Bu Tur Bitti!</h3>
        <p className="text-sm text-zinc-400 mb-6">
          {isRoomMode
            ? 'İkiniz de turu tamamladınız! Ortak beğeni çıkmadıysa en çok yaklaştığınız alternatifleri oylayabilirsiniz.'
            : `Tur ${roundNumber} tamamlandı. Yeni bir tura başlayabilirsiniz.`}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* Fallback Voting Button */}
          {isRoomMode && onOpenFallback && (
            <button
              onClick={onOpenFallback}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Alternatifleri Oyla (Fallback)</span>
            </button>
          )}

          {/* Next Round Button */}
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
        <h3 className="text-xl font-bold text-white mb-2">
          {movies.length === 0 && !isLoading ? 'Film Bulunamadı' : 'Filmler Yükleniyor'}
        </h3>
        <p className="text-sm text-zinc-400 mb-6">
          {movies.length === 0 && !isLoading
            ? 'Seçtiğiniz filtrelere uygun film bulunamadı. Lütfen filtreleri sıfırlamayı deneyin.'
            : 'Seçtiğiniz kriterlere uygun filmler hazırlanıyor...'}
        </p>
        {movies.length === 0 && !isLoading && onResetGenre && (
          <button
            onClick={onResetGenre}
            className="py-2.5 px-6 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Filtreleri Sıfırla
          </button>
        )}
      </div>
    )
  }

  const currentCount = Math.min(roundIndex + 1, effectiveLimit)
  const progressPercent = Math.min(100, (roundIndex / effectiveLimit) * 100)

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between px-4 pb-4 overflow-hidden">
      {/* Top Round Progress Bar or Solo Discovery Indicator */}
      <div className="w-full py-1.5 flex flex-col gap-1.5 z-10">
        {hasRoundLimit ? (
          <>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
              <span className="text-zinc-500 font-medium">Tur {roundNumber}</span>
              <span className="text-white font-mono">{currentCount} / {effectiveLimit}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sınırsız Keşif
            </span>
            <span className="text-zinc-400 text-[11px] font-medium">
              🍿 <strong className="text-white">{totalSwipesCount}</strong> film incelendi
            </span>
          </div>
        )}
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
            onOpenDetails={onOpenDetails}
          />
        )}

        {/* Current Top Card */}
        <MovieCard
          key={currentMovie.id}
          movie={currentMovie}
          isTopCard={true}
          dragOffset={dragOffset}
          isDragging={isDragging}
          onOpenDetails={onOpenDetails}
        />
      </div>

      {/* Centered Action Buttons Toolbar */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 py-2 z-30">
        {/* Pass Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('pass')}
          className="w-13 h-13 rounded-full bg-zinc-900 border-2 border-rose-500/50 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
          title="Pas (Geç)"
        >
          <X className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* Veto Button (In Room Mode) */}
        {isRoomMode && (
          <button
            type="button"
            disabled={remainingVetoes <= 0}
            onClick={handleVetoClick}
            className={`relative w-13 h-13 rounded-full bg-zinc-900 border-2 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer ${
              remainingVetoes > 0
                ? 'border-red-600/60 text-red-500 hover:bg-red-500/10 hover:border-red-500'
                : 'border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
            }`}
            title={`Veto Et (Kalan: ${remainingVetoes})`}
          >
            <Ban className="w-5 h-5 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shadow">
              {remainingVetoes}
            </span>
          </button>
        )}

        {/* Watched Button */}
        <button
          type="button"
          onClick={() => triggerSwipe('watched')}
          className="w-13 h-13 rounded-full bg-zinc-900 border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
          title="İzledim"
        >
          <Eye className="w-5 h-5 stroke-[2.2]" />
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

      {/* Keyboard Shortcut Hints (Desktop) */}
      <div className="flex items-center justify-center gap-6 text-[11px] text-zinc-500 font-mono select-none pt-0.5 pb-1">
        <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">←</kbd> Pas
        </span>
        {isRoomMode && (
          <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">V</kbd> Veto ({remainingVetoes})
          </span>
        )}
        <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">↓ / ↑</kbd> İzledim
        </span>
        <span className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">→</kbd> Beğen
        </span>
      </div>
    </div>
  )
}
