import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Heart, Eye, RotateCcw, Sparkles, Ban, Trophy, Users } from 'lucide-react'
import type { Movie, SwipeAction, RoomMode, GroupParticipant } from '../types'
import { getMovieImageCandidates } from '../services/tmdb'
import { MovieCard } from './MovieCard'
import { hapticLike, hapticPass, hapticVeto, hapticWatched, hapticLight } from '../utils/haptics'

interface SwipeDeckProps {
  movies: Movie[]
  onSwipe: (movie: Movie, action: SwipeAction) => void | boolean | Promise<void | boolean>
  onLoadNextRound: () => void
  onRoundComplete?: () => void
  onResetGenre?: () => void
  isLoading: boolean
  roundNumber?: number
  roundLimit?: number
  hasRoundLimit?: boolean
  isRoomMode?: boolean
  roomMode?: RoomMode
  groupParticipants?: GroupParticipant[]
  totalSwipesCount?: number
  onOpenDetails?: (movie: Movie) => void
  onOpenFallback?: () => void
  onOpenGroupResults?: () => void
  partnerSwipesCount?: number
  initialIndex?: number
  vetoedMovieIds?: Set<number>
  onUndo?: () => void
}

export function SwipeDeck({
  movies,
  onSwipe,
  onUndo,
  onLoadNextRound,
  onRoundComplete,
  onResetGenre,
  isLoading,
  roundNumber = 1,
  roundLimit = 25,
  hasRoundLimit = true,
  isRoomMode = false,
  roomMode = 'pair',
  groupParticipants = [],
  totalSwipesCount = 0,
  onOpenDetails,
  onOpenFallback,
  onOpenGroupResults,
  partnerSwipesCount,
  initialIndex = 0,
  vetoedMovieIds,
}: SwipeDeckProps) {
  const [roundIndex, setRoundIndex] = useState(initialIndex)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [remainingVetoes, setRemainingVetoes] = useState(3)

  const startPos = useRef({ x: 0, y: 0 })
  const isPointerDown = useRef(false)
  const swipeInProgress = useRef(false)
  const hasAutoOpenedFallback = useRef(false)
  const hasThresholdVibrated = useRef(false)
  const swipeActionsRef = useRef<SwipeAction[]>([])

  useEffect(() => {
    swipeInProgress.current = false
  }, [roundIndex])

  // Reset auto-open flag and veto count on each new round
  useEffect(() => {
    hasAutoOpenedFallback.current = false
    setRemainingVetoes(3)
    swipeActionsRef.current = []
  }, [roundNumber])

  // Sync initialIndex if updated externally
  useEffect(() => {
    if (initialIndex > 0) {
      setRoundIndex((prev) => Math.max(prev, initialIndex))
    }
  }, [initialIndex])

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
      const candidates = getMovieImageCandidates(m)
      if (candidates.length > 0) {
        const img = new Image()
        img.src = candidates[0]
      }
    })
  }, [roundIndex, movies])

  const triggerSwipe = useCallback(
    (action: SwipeAction) => {
      const currentMovie = movies[roundIndex]
      if (!currentMovie || isLoading || swipeInProgress.current) return
      swipeInProgress.current = true

      // Set target offset for natural arc exit animation and trigger haptic feedback
      if (action === 'pass') {
        hapticPass()
        setDragOffset({ x: -window.innerWidth - 120, y: dragOffset.y + 40 })
      } else if (action === 'like') {
        hapticLike()
        setDragOffset({ x: window.innerWidth + 120, y: dragOffset.y + 40 })
      } else if (action === 'veto') {
        hapticVeto()
        setDragOffset({ x: dragOffset.x * 0.4, y: window.innerHeight + 120 })
      } else {
        // watched
        hapticWatched()
        const exitY = dragOffset.y > 0 ? window.innerHeight + 120 : -window.innerHeight - 120
        setDragOffset({ x: dragOffset.x * 0.4, y: exitY })
      }

      setTimeout(() => {
        void Promise.resolve(onSwipe(currentMovie, action)).then((saved) => {
          if (saved === false) {
            if (action === 'veto') setRemainingVetoes((prev) => Math.min(3, prev + 1))
            swipeInProgress.current = false
            setDragOffset({ x: 0, y: 0 })
            return
          }
          setRoundIndex((prev) => prev + 1)
          swipeActionsRef.current.push(action)
          setDragOffset({ x: 0, y: 0 })
        }).catch(() => {
          if (action === 'veto') setRemainingVetoes((prev) => Math.min(3, prev + 1))
          swipeInProgress.current = false
          setDragOffset({ x: 0, y: 0 })
        })
      }, 250)
    },
    [roundIndex, movies, onSwipe, isLoading]
  )

  // A partner veto marks a slot as already resolved. Keep the canonical deck
  // intact and pass that slot locally so both devices retain the same 25-card limit.
  useEffect(() => {
    const currentMovie = movies[roundIndex]
    if (
      isRoomMode &&
      !isLoading &&
      currentMovie &&
      vetoedMovieIds?.has(currentMovie.id) &&
      !swipeInProgress.current
    ) {
      triggerSwipe('pass')
    }
  }, [isRoomMode, isLoading, movies, roundIndex, vetoedMovieIds, triggerSwipe])

  const handleVetoClick = useCallback(() => {
    if (remainingVetoes <= 0) return
    setRemainingVetoes((prev) => Math.max(0, prev - 1))
    triggerSwipe('veto')
  }, [remainingVetoes, triggerSwipe])

  const canUndo = roundIndex > 0 && !isLoading && !swipeInProgress.current

  const handleUndo = useCallback(() => {
    if (roundIndex <= 0 || isLoading || swipeInProgress.current) return
    hapticLight()
    const lastAction = swipeActionsRef.current.pop()
    if (lastAction === 'veto') {
      setRemainingVetoes((prev) => Math.min(3, prev + 1))
    }
    setDragOffset({ x: 0, y: 0 })
    setRoundIndex((prev) => Math.max(0, prev - 1))
    onUndo?.()
  }, [roundIndex, isLoading, onUndo])

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }

      if ((e.key.toLowerCase() === 'z' || e.key === 'Backspace') && canUndo) {
        e.preventDefault()
        handleUndo()
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
  }, [triggerSwipe, handleVetoClick, handleUndo, canUndo, roundIndex, roundLimit, hasRoundLimit, movies, isRoomMode])

  // Touch & Mouse Handlers
  const handleStart = (clientX: number, clientY: number) => {
    isPointerDown.current = true
    hasThresholdVibrated.current = false
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isPointerDown.current) return
    const dx = clientX - startPos.current.x
    const dy = clientY - startPos.current.y
    setDragOffset({ x: dx, y: dy })

    // Provide light tactile cue when crossing swipe activation threshold
    const thresholdX = window.innerWidth * 0.25
    if (!hasThresholdVibrated.current && (Math.abs(dx) > thresholdX || Math.abs(dy) > 60)) {
      hasThresholdVibrated.current = true
      hapticLight()
    }
  }

  const handleEnd = () => {
    if (!isPointerDown.current) return
    isPointerDown.current = false
    setIsDragging(false)

    const thresholdX = window.innerWidth * 0.25
    const thresholdY = window.innerHeight * 0.18

    if (dragOffset.x > thresholdX) {
      triggerSwipe('like')
    } else if (dragOffset.x < -thresholdX) {
      triggerSwipe('pass')
    } else if (Math.abs(dragOffset.y) > thresholdY) {
      triggerSwipe('watched')
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Automatically trigger fallback voting modal ONCE when both users finish and no direct match occurred
  useEffect(() => {
    if (
      isRoomMode &&
      roomMode !== 'group' &&
      hasRoundLimit &&
      movies.length > 0 &&
      roundIndex >= effectiveLimit &&
      (partnerSwipesCount ?? 0) >= effectiveLimit &&
      !hasAutoOpenedFallback.current &&
      onOpenFallback
    ) {
      const timer = setTimeout(() => {
        hasAutoOpenedFallback.current = true
        onOpenFallback()
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isRoomMode, roomMode, hasRoundLimit, movies.length, roundIndex, effectiveLimit, partnerSwipesCount, onOpenFallback])

  // Automatically trigger group results modal ONCE when all group members finish
  const hasAutoOpenedGroup = useRef(false)
  useEffect(() => {
    if (
      isRoomMode &&
      roomMode === 'group' &&
      hasRoundLimit &&
      movies.length > 0 &&
      roundIndex >= effectiveLimit &&
      !hasAutoOpenedGroup.current &&
      onOpenGroupResults
    ) {
      const others = groupParticipants.filter((p) => p.userId !== undefined)
      const allFinished = others.length > 0 && others.every((p) => (p.swipesCount || 0) >= effectiveLimit)
      if (allFinished) {
        const timer = setTimeout(() => {
          hasAutoOpenedGroup.current = true
          onOpenGroupResults()
        }, 700)
        return () => clearTimeout(timer)
      }
    }
  }, [isRoomMode, roomMode, hasRoundLimit, movies.length, roundIndex, effectiveLimit, groupParticipants, onOpenGroupResults])

  // End of Round (25 Movies Limit or end of curated deck) in Room Mode
  if (hasRoundLimit && movies.length > 0 && roundIndex >= effectiveLimit) {
    onRoundComplete?.()

    // 1. Group Mode Live Scoreboard & Results
    if (isRoomMode && roomMode === 'group') {
      const others = groupParticipants.filter((p) => p.userId !== undefined)
      const allFinished = others.length > 0 && others.every((p) => (p.swipesCount || 0) >= effectiveLimit)

      return (
        <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-5 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Trophy className="w-8 h-8 animate-pulse text-amber-400" />
          </div>
          <h3 className="text-xl font-black text-white mb-1">Harika! {effectiveLimit} Filmi Oyladın</h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-xs leading-relaxed">
            {allFinished
              ? 'Tüm grup üyeleri oylamayı tamamladı! Zirve sonuçlarını görebilirsiniz.'
              : 'Gruptaki diğer arkadaşların oylamayı bitirmesi bekleniyor...'}
          </p>

          {/* Group live scoreboard */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full max-w-xs mb-4 flex flex-col gap-2.5 shadow-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Grup İlerlemesi</span>
              <span className="text-amber-400 font-mono">Tur {roundNumber}</span>
            </div>

            {/* You */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-emerald-500/40">
              <div className="flex items-center gap-2">
                <span className="text-xs">👑</span>
                <span className="text-xs font-bold text-white">Sen</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {effectiveLimit} / {effectiveLimit} (Tamam)
              </span>
            </div>

            {/* Other participants */}
            {groupParticipants.map((p, idx) => (
              <div
                key={p.userId || idx}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">{p.avatar || '🍿'}</span>
                  <span className="text-xs font-bold text-zinc-200 truncate max-w-[120px]">
                    {p.username || `Katılımcı #${idx + 1}`}
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    (p.swipesCount || 0) >= effectiveLimit
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-amber-400 bg-amber-500/10'
                  }`}
                >
                  {(p.swipesCount || 0) >= effectiveLimit
                    ? `${effectiveLimit} / ${effectiveLimit} (Tamam)`
                    : `${p.swipesCount || 0} / ${effectiveLimit}`}
                </span>
              </div>
            ))}
          </div>

          {/* Group Results CTA Button */}
          {onOpenGroupResults && (
            <button
              onClick={onOpenGroupResults}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/25 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mb-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Grup Zirve Sonuçlarını Aç →</span>
            </button>
          )}

          {/* Next Round Button */}
          <button
            onClick={() => {
              setRoundIndex(0)
              onLoadNextRound()
            }}
            disabled={isLoading}
            className="w-full max-w-xs py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Yeni Tura Geç (Tur {roundNumber + 1})</span>
          </button>
        </div>
      )
    }

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

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-4">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Her iki taraf da bitirdiğinde sonuçlar açılacak</span>
          </div>

          {/* Quick unlock button if partner reached at least 24 films or to resolve edge cases */}
          {partnerSwipesCount >= effectiveLimit - 1 && onOpenFallback && (
            <button
              onClick={onOpenFallback}
              className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all cursor-pointer shadow-md"
            >
              Sonuçları ve Alternatifleri Aç →
            </button>
          )}
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

  // Realtime gesture progress for button micro-interactions
  const isHorizontalDrag = Math.abs(dragOffset.x) > Math.abs(dragOffset.y) * 1.15
  const isVerticalDrag = Math.abs(dragOffset.y) > Math.abs(dragOffset.x) * 1.15

  const likeProgress = isHorizontalDrag && dragOffset.x > 25 ? Math.min(1, (dragOffset.x - 25) / 95) : 0
  const passProgress = isHorizontalDrag && dragOffset.x < -25 ? Math.min(1, (-dragOffset.x - 25) / 95) : 0
  const watchedProgress = isVerticalDrag && Math.abs(dragOffset.y) > 25 ? Math.min(1, (Math.abs(dragOffset.y) - 25) / 95) : 0
  const vetoProgress = 0

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-3 sm:px-4 pb-3 pt-0.5 overflow-hidden">
      {/* Main Card & Floating Overlays Stage */}
      <div className="relative flex-1 w-full min-h-0">
        {/* Card Stack Area */}
        <div
          className="absolute inset-0 w-full h-full touch-none select-none"
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          {/* Next Card in Stack (with Parallax & Scale-up response) */}
          {nextMovie && (
            <MovieCard
              key={nextMovie.id}
              movie={nextMovie}
              isTopCard={false}
              dragOffset={dragOffset}
              isDragging={isDragging}
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

        {/* Floating Story-Style Top Bar Overlay (Thin Progress Line + Undo & Round Status) */}
        <div className="absolute top-2.5 inset-x-3.5 z-30 pointer-events-none flex flex-col gap-2">
          {/* Story Progress Bar */}
          {hasRoundLimit && (
            <div className="w-full h-1 bg-black/50 backdrop-blur-md rounded-full overflow-hidden border border-white/10 shadow-sm">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Controls & Round Info Row */}
          <div className="flex items-center justify-between pointer-events-none">
            {/* Left: Undo Button + Round/Solo Badge */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className={`p-1.5 rounded-xl border backdrop-blur-md transition-all flex items-center justify-center cursor-pointer ${
                  canUndo
                    ? 'bg-zinc-950/80 hover:bg-zinc-900 text-amber-400 hover:text-amber-300 border-white/20 shadow-lg active:scale-90'
                    : 'bg-zinc-950/40 text-zinc-600 border-white/5 opacity-40 cursor-not-allowed'
                }`}
                title={canUndo ? 'Önceki filme geri dön (Z / Backspace)' : 'Geri alınacak film yok'}
                aria-label="Geri Al"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {hasRoundLimit ? (
                <div className="flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] font-medium text-zinc-300 shadow">
                  <span className="text-zinc-400">Tur {roundNumber}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-white font-mono font-bold">{currentCount}/{effectiveLimit}</span>
                  {isRoomMode && roomMode === 'group' && (
                    <span className="text-[10px] font-bold text-amber-400 ml-1">
                      🍿 {groupParticipants && groupParticipants.length > 0 ? groupParticipants.length : 3}P
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] font-medium text-zinc-300 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-zinc-400">🍿 <strong className="text-white">{totalSwipesCount}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Centered Action Buttons Toolbar (Tinder-style dock with reactive drag scale & glow) */}
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 sm:gap-5 z-30 pointer-events-none">
          {/* Pass Button */}
          <button
            type="button"
            onClick={() => triggerSwipe('pass')}
            style={{ transform: `scale(${1 + passProgress * 0.22})` }}
            className={`w-13 h-13 rounded-full bg-zinc-950/90 backdrop-blur-md border-2 transition-all flex items-center justify-center cursor-pointer pointer-events-auto ${
              passProgress > 0.15
                ? 'border-rose-400 bg-rose-500/30 text-rose-300 shadow-2xl shadow-rose-500/60'
                : 'border-rose-500/60 text-rose-500 hover:bg-rose-500/20 hover:border-rose-400 hover:scale-105 shadow-xl'
            } active:scale-90`}
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
              style={{ transform: `scale(${1 + vetoProgress * 0.22})` }}
              className={`relative w-13 h-13 rounded-full bg-zinc-950/90 backdrop-blur-md border-2 transition-all flex items-center justify-center cursor-pointer pointer-events-auto ${
                remainingVetoes > 0
                  ? vetoProgress > 0.15
                    ? 'border-red-500 bg-red-600/35 text-red-300 shadow-2xl shadow-red-600/70'
                    : 'border-red-600/70 text-red-500 hover:bg-red-500/20 hover:border-red-500 hover:scale-105 shadow-xl'
                  : 'border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
              } active:scale-90`}
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
            style={{ transform: `scale(${1 + watchedProgress * 0.22})` }}
            className={`w-13 h-13 rounded-full bg-zinc-950/90 backdrop-blur-md border-2 transition-all flex items-center justify-center cursor-pointer pointer-events-auto ${
              watchedProgress > 0.15
                ? 'border-purple-400 bg-purple-500/35 text-purple-300 shadow-2xl shadow-purple-500/70'
                : 'border-purple-500/60 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 hover:scale-105 shadow-xl'
            } active:scale-90`}
            title="İzledim"
          >
            <Eye className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Like Button */}
          <button
            type="button"
            onClick={() => triggerSwipe('like')}
            style={{ transform: `scale(${1 + likeProgress * 0.22})` }}
            className={`w-14 h-14 rounded-full bg-zinc-950/90 backdrop-blur-md border-2 transition-all flex items-center justify-center cursor-pointer pointer-events-auto ${
              likeProgress > 0.15
                ? 'border-emerald-300 bg-emerald-500/35 text-emerald-300 shadow-2xl shadow-emerald-500/70'
                : 'border-emerald-500/70 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:scale-105 shadow-2xl shadow-emerald-500/25'
            } active:scale-90`}
            title="Beğen"
          >
            <Heart className="w-7 h-7 fill-emerald-400 text-emerald-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
