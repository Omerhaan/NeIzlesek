import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Star, Sparkles, X, RotateCcw, LogOut, ChevronDown, ChevronUp, Ban, Play } from 'lucide-react'
import type { GroupVoteResult, Movie } from '../types'
import { LOGO_BASE_URL } from '../services/tmdb'
import { MovieArtwork } from './MovieArtwork'
import { hapticMatch, hapticLight } from '../utils/haptics'

interface GroupResultModalProps {
  isOpen: boolean
  onClose: () => void
  results: GroupVoteResult[]
  vetoedMovies?: Movie[]
  totalParticipants?: number
  roundNumber?: number
  onNextRound?: () => void
  onLeaveRoom?: () => void
  onSelectMovie?: (movie: Movie) => void
}

export function GroupResultModal({
  isOpen,
  onClose,
  results,
  vetoedMovies = [],
  totalParticipants = 3,
  roundNumber = 1,
  onNextRound,
  onLeaveRoom,
  onSelectMovie,
}: GroupResultModalProps) {
  const [showVetoed, setShowVetoed] = useState(false)
  const [activeTrailerId, setActiveTrailerId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && results.length > 0) {
      hapticMatch()
      // Confetti burst
      const duration = 2.5 * 1000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#e50914', '#f59e0b', '#10b981', '#fbbf24', '#3b82f6'],
        })
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#e50914', '#f59e0b', '#10b981', '#fbbf24', '#3b82f6'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [isOpen, results.length])

  if (!isOpen || results.length === 0) return null

  const winner = results[0]
  const secondPlace = results[1]
  const thirdPlace = results[2]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                Watch Party Zirvesi
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Tur {roundNumber}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {totalParticipants} kişilik grubun ortak kararı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Winner Showcase Card (1st Place) */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-gradient-to-b from-amber-950/20 to-zinc-900 shadow-xl shadow-amber-500/10">
            {/* 1st Place Ribbon */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs shadow-lg uppercase tracking-wider">
              <span>🥇</span>
              <span>Grup 1.si (%{winner.percentage})</span>
            </div>

            {/* Poster / Backdrop */}
            <div className="relative h-56 sm:h-64 w-full overflow-hidden">
              <MovieArtwork
                movie={winner.movie}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

              {/* Vote Count Pill */}
              <div className="absolute top-3 right-3 z-20 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-400/40 text-amber-300 font-mono text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {winner.votesCount} Oy
              </div>

              {/* Title & Meta on bottom of poster */}
              <div className="absolute bottom-3 left-4 right-4 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md leading-tight">
                  {winner.movie.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-300 flex-wrap">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {winner.movie.vote_average.toFixed(1)}
                  </span>
                  {winner.movie.release_date && (
                    <span className="text-zinc-400">
                      {winner.movie.release_date.substring(0, 4)}
                    </span>
                  )}
                  {winner.movie.runtime && (
                    <span className="text-zinc-400">
                      • {winner.movie.runtime} dk
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Winner Details & Voters */}
            <div className="p-4 flex flex-col gap-3">
              {/* Voters List */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-zinc-400">Oy Verenler:</span>
                {winner.voterNames.map((name, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md"
                  >
                    ✓ {name}
                  </span>
                ))}
              </div>

              {/* Overview */}
              {winner.movie.overview && (
                <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                  {winner.movie.overview}
                </p>
              )}

              {/* Providers */}
              {winner.movie.providers && winner.movie.providers.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Nerede İzlenir?
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {winner.movie.providers.map((p) => (
                      <div
                        key={p.provider_id}
                        className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl"
                      >
                        <img
                          src={`${LOGO_BASE_URL}${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-xs text-zinc-200 font-medium">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Trailer Embed toggle */}
              {winner.movie.trailerKey && (
                <div>
                  {activeTrailerId === winner.movie.trailerKey ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden mt-2 border border-zinc-800">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${winner.movie.trailerKey}?autoplay=1`}
                        title="Fragman"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTrailerId(winner.movie.trailerKey || null)}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Fragmanı İzle
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Runners-up Podium (2nd & 3rd Place) */}
          {(secondPlace || thirdPlace) && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                Diğer Zirve Adayları
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {secondPlace && (
                  <div
                    onClick={() => onSelectMovie?.(secondPlace.movie)}
                    className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex gap-3 cursor-pointer"
                  >
                    <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                      <MovieArtwork movie={secondPlace.movie} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-300 mb-0.5">
                        <span>🥈 2. Sıra</span>
                        <span className="text-zinc-500 font-normal font-mono">({secondPlace.votesCount} Oy)</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{secondPlace.movie.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{secondPlace.movie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {thirdPlace && (
                  <div
                    onClick={() => onSelectMovie?.(thirdPlace.movie)}
                    className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex gap-3 cursor-pointer"
                  >
                    <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                      <MovieArtwork movie={thirdPlace.movie} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 mb-0.5">
                        <span>🥉 3. Sıra</span>
                        <span className="text-zinc-500 font-normal font-mono">({thirdPlace.votesCount} Oy)</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{thirdPlace.movie.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{thirdPlace.movie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vetoed Movies Accordion */}
          {vetoedMovies.length > 0 && (
            <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/40">
              <button
                type="button"
                onClick={() => {
                  hapticLight()
                  setShowVetoed(!showVetoed)
                }}
                className="w-full p-3 flex items-center justify-between text-left text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span>Veto Edilen Filmler ({vetoedMovies.length})</span>
                </div>
                {showVetoed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showVetoed && (
                <div className="p-3 pt-0 flex flex-col gap-2 border-t border-zinc-800/50">
                  <p className="text-[11px] text-zinc-500 mb-1">
                    Grup üyeleri tarafından veto hakkı kullanılarak elenen filmler:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {vetoedMovies.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-red-950/40 text-left"
                      >
                        <div className="w-8 h-10 rounded overflow-hidden bg-zinc-800 shrink-0">
                          <MovieArtwork movie={m} className="w-full h-full object-cover grayscale opacity-70" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-zinc-300 truncate">{m.title}</div>
                          <span className="text-[10px] text-red-400 font-semibold">Veto Edildi</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex flex-col gap-2">
          {/* Main Action: Pick Winner */}
          <button
            onClick={() => {
              onSelectMovie?.(winner.movie)
              onClose()
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🍿 Bu Gece Bunu İzliyoruz!</span>
          </button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            {onNextRound && (
              <button
                onClick={onNextRound}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Yeni Tur Başlat</span>
              </button>
            )}

            {onLeaveRoom && (
              <button
                onClick={onLeaveRoom}
                className="py-2.5 px-3 bg-zinc-950 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Odadan Ayrıl</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
