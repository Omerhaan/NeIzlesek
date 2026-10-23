import { useState } from 'react'
import { Trophy, Star, Calendar, Users, Check } from 'lucide-react'
import type { TasteProfile } from '../services/tasteProfile'
import type { Movie, MatchedMovieEntry } from '../types'
import { MovieArtwork } from './MovieArtwork'
import { updateMatchRating, markMovieAsWatched } from '../services/tasteProfile'
import { hapticLike } from '../utils/haptics'

interface MatchArchiveProps {
  tasteProfile: TasteProfile
  onUpdateTasteProfile?: (profile: TasteProfile) => void
  onSelectMovieForDetail?: (movie: Movie) => void
}

export function MatchArchive({
  tasteProfile,
  onUpdateTasteProfile,
  onSelectMovieForDetail,
}: MatchArchiveProps) {
  const matchHistory = tasteProfile.matchHistory || []
  const [ratingMovieId, setRatingMovieId] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number>(8)

  const handleRate = (movieId: number, rating: number) => {
    hapticLike()
    const updated = updateMatchRating(tasteProfile, movieId, rating)
    // Also mark as watched in taste profile if not already
    const matchedEntry = matchHistory.find((m) => m.movie.id === movieId)
    if (matchedEntry) {
      const withWatched = markMovieAsWatched(updated, matchedEntry.movie, rating)
      onUpdateTasteProfile?.(withWatched)
    } else {
      onUpdateTasteProfile?.(updated)
    }
    setRatingMovieId(null)
  }

  const isWatched = (movieId: number) => {
    return (
      (tasteProfile.watchedMovieIds || []).includes(movieId) ||
      (tasteProfile.watchedMovies || []).some((w) => w.movie.id === movieId)
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Ortak Eşleşmeler Arşivi
          </h3>
        </div>
        <span className="text-[11px] text-amber-400 font-bold font-mono">
          {matchHistory.length} Film Eşleşti
        </span>
      </div>

      {matchHistory.length === 0 ? (
        <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl text-center text-zinc-500 text-xs">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-zinc-600 stroke-1" />
          <h4 className="font-bold text-zinc-300 text-sm mb-1">
            Henüz Ortak Eşleşme Yok
          </h4>
          <p className="max-w-xs mx-auto text-zinc-400 leading-relaxed mb-3">
            Oda kurup partnerinle aynı 25 filmlik tura başlayın. İki tarafın da beğendiği
            veya tur sonunda seçtiğiniz filmler bu arşive kaydedilir.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matchHistory.map((entry: MatchedMovieEntry) => {
            const watched = isWatched(entry.movie.id)
            const dateStr = new Date(entry.matchedAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })

            return (
              <div
                key={entry.movie.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-3 flex gap-3 shadow-lg transition-all"
              >
                {/* Poster */}
                <div
                  onClick={() => onSelectMovieForDetail?.(entry.movie)}
                  className="w-20 h-28 rounded-2xl overflow-hidden shrink-0 relative aspect-[2/3] border border-zinc-800 cursor-pointer shadow-md"
                >
                  <MovieArtwork
                    movie={entry.movie}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-black/80 px-1 py-0.5 rounded">
                    ★ {entry.movie.vote_average?.toFixed(1) || '7.5'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Trophy className="w-2.5 h-2.5" />
                        Eşleşildi
                      </span>
                      {entry.roomCode && (
                        <span className="text-[10px] font-mono text-zinc-500 font-bold bg-zinc-800 px-1.5 py-0.5 rounded-md">
                          #{entry.roomCode}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => onSelectMovieForDetail?.(entry.movie)}
                      className="text-sm font-bold text-white truncate cursor-pointer hover:text-red-400 transition-colors"
                      title={entry.movie.title}
                    >
                      {entry.movie.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {dateStr}
                      </span>
                      {entry.partnerName && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Users className="w-2.5 h-2.5 text-zinc-500" />
                          {entry.partnerName} ile
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating / Watched Status */}
                  <div className="pt-2 border-t border-zinc-800/80 mt-1 flex items-center justify-between">
                    {entry.myRating ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>Puanın: {entry.myRating}/10</span>
                        </div>
                        {watched && (
                          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            İzlendi
                          </span>
                        )}
                      </div>
                    ) : ratingMovieId === entry.movie.id ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <select
                          value={selectedRating}
                          onChange={(e) => setSelectedRating(Number(e.target.value))}
                          className="bg-black border border-amber-500/50 rounded-lg text-xs font-bold text-amber-400 px-2 py-1 outline-none font-mono"
                        >
                          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} ★
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRate(entry.movie.id, selectedRating)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setRatingMovieId(null)}
                          className="px-1.5 py-1 text-zinc-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRatingMovieId(entry.movie.id)
                          setSelectedRating(8)
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>İzledik ve Puanla</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
