import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { X, Sparkles, Star, Film, Dices, RotateCcw, Play } from 'lucide-react'
import type { Movie } from '../types'
import { MovieArtwork } from './MovieArtwork'
import { LOGO_BASE_URL } from '../services/tmdb'
import { hapticMatch, hapticLight } from '../utils/haptics'
import { playMatchSound, playRouletteTickSound } from '../utils/audio'

interface MovieRouletteModalProps {
  isOpen: boolean
  onClose: () => void
  likedMovies: Movie[]
  matchedMovies?: Movie[]
  onOpenDetails?: (movie: Movie) => void
}

export function MovieRouletteModal({
  isOpen,
  onClose,
  likedMovies = [],
  matchedMovies = [],
  onOpenDetails,
}: MovieRouletteModalProps) {
  const [sourcePool, setSourcePool] = useState<'liked' | 'matches' | 'all'>('all')
  const [isSpinning, setIsSpinning] = useState(false)
  const [winnerMovie, setWinnerMovie] = useState<Movie | null>(null)
  const [displayMovie, setDisplayMovie] = useState<Movie | null>(null)

  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Candidate pool based on selected source
  const candidates =
    sourcePool === 'matches'
      ? matchedMovies
      : sourcePool === 'liked'
      ? likedMovies
      : Array.from(new Map([...matchedMovies, ...likedMovies].map((m) => [m.id, m])).values())

  useEffect(() => {
    if (isOpen) {
      setWinnerMovie(null)
      setIsSpinning(false)
      if (candidates.length > 0) {
        setDisplayMovie(candidates[Math.floor(Math.random() * candidates.length)])
      }
    } else {
      if (spinTimerRef.current) clearInterval(spinTimerRef.current)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSpin = () => {
    if (candidates.length === 0 || isSpinning) return
    setIsSpinning(true)
    setWinnerMovie(null)
    hapticLight()

    let currentInterval = 60
    let totalTicks = 0
    const targetTicks = 26 + Math.floor(Math.random() * 8)
    const finalWinner = candidates[Math.floor(Math.random() * candidates.length)]

    const step = () => {
      totalTicks += 1
      playRouletteTickSound()
      hapticLight()

      // Random movie for visual slot effect
      const randomIdx = Math.floor(Math.random() * candidates.length)
      setDisplayMovie(candidates[randomIdx])

      if (totalTicks >= targetTicks) {
        // Land on winner!
        setDisplayMovie(finalWinner)
        setWinnerMovie(finalWinner)
        setIsSpinning(false)
        hapticMatch()
        playMatchSound()

        // Confetti burst
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#e50914', '#f59e0b', '#10b981', '#6366f1'],
        })
        return
      }

      // Decelerate gradually
      if (totalTicks > targetTicks - 8) {
        currentInterval += 45
      } else if (totalTicks > targetTicks - 14) {
        currentInterval += 20
      }

      spinTimerRef.current = setTimeout(step, currentInterval)
    }

    spinTimerRef.current = setTimeout(step, currentInterval)
  }

  const releaseYear = (displayMovie?.release_date || '').substring(0, 4)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Dices className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-black text-white">Film Ruleti</h3>
        </div>
        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
          Kararsız mı kaldınız? Beğendiğiniz filmler arasından bu akşamın seçimini çark belirlesin!
        </p>

        {/* Source Pool Selector */}
        {matchedMovies.length > 0 && likedMovies.length > 0 && (
          <div className="grid grid-cols-3 p-1 bg-zinc-900 border border-zinc-800 rounded-xl my-3 w-full text-[11px] font-bold">
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setSourcePool('all')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                sourcePool === 'all'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tümü ({likedMovies.length + matchedMovies.length})
            </button>
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setSourcePool('liked')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                sourcePool === 'liked'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Beğenilen ({likedMovies.length})
            </button>
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setSourcePool('matches')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                sourcePool === 'matches'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Eşleşmeler ({matchedMovies.length})
            </button>
          </div>
        )}

        {/* Slot Stage / Card Display */}
        {candidates.length === 0 ? (
          <div className="my-8 p-6 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col items-center text-zinc-500 gap-2">
            <Film className="w-10 h-10 text-zinc-700 stroke-1" />
            <p className="text-xs font-semibold text-zinc-400">Çark için henüz kayıtlı film yok</p>
            <p className="text-[11px] text-zinc-500 leading-snug">
              Önce ana akıştan birkaç film beğen veya bir arkadaşınla eşleşme yakala!
            </p>
          </div>
        ) : (
          <div className="relative my-3 w-full flex flex-col items-center">
            {/* Roulette Card Showcase */}
            <div
              className={`relative w-48 h-68 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-150 ${
                winnerMovie
                  ? 'border-amber-400 shadow-amber-500/30 scale-105 animate-in zoom-in-95'
                  : isSpinning
                  ? 'border-red-500/80 shadow-red-500/20 scale-98 animate-pulse'
                  : 'border-zinc-800'
              }`}
            >
              {displayMovie ? (
                <>
                  <MovieArtwork
                    movie={displayMovie}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                  {/* Winner Banner */}
                  {winnerMovie && (
                    <div className="absolute top-2 inset-x-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-1 animate-bounce">
                      <Sparkles className="w-3 h-3" />
                      Bu Akşamın Filmi!
                    </div>
                  )}

                  {/* Bottom Movie Title and Meta */}
                  <div className="absolute bottom-2.5 inset-x-2 text-left">
                    <h4 className="text-sm font-black text-white line-clamp-1 leading-tight drop-shadow">
                      {displayMovie.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-zinc-300">
                      {displayMovie.vote_average > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {displayMovie.vote_average.toFixed(1)}
                        </span>
                      )}
                      {releaseYear && <span>{releaseYear}</span>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                  <Film className="w-10 h-10 animate-pulse" />
                </div>
              )}
            </div>

            {/* Providers if Winner */}
            {winnerMovie && winnerMovie.providers && winnerMovie.providers.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-medium">Nerede:</span>
                {winnerMovie.providers.slice(0, 3).map((p) => (
                  <img
                    key={p.provider_id}
                    src={`${LOGO_BASE_URL}${p.logo_path}`}
                    alt={p.provider_name}
                    title={p.provider_name}
                    className="w-4 h-4 rounded object-cover shadow"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 mt-2">
          {candidates.length > 0 && (
            <button
              type="button"
              disabled={isSpinning}
              onClick={handleSpin}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer ${
                winnerMovie
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black shadow-amber-500/25'
              }`}
            >
              {winnerMovie ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Tekrar Çarkı Çevir</span>
                </>
              ) : isSpinning ? (
                <>
                  <Dices className="w-4 h-4 animate-spin text-black" />
                  <span>Kader Belirleniyor...</span>
                </>
              ) : (
                <>
                  <Dices className="w-4 h-4" />
                  <span>Çarkı Çevir & Seç!</span>
                </>
              )}
            </button>
          )}

          {/* Winner Extra Action Buttons */}
          {winnerMovie && (
            <div className="grid grid-cols-2 gap-2 mt-1 animate-in fade-in">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  winnerMovie.title + ' filmi izle'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Hemen İzle</span>
              </a>

              {onOpenDetails && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenDetails(winnerMovie)
                  }}
                  className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer border border-zinc-700"
                >
                  <span>Detay & Fragman</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
