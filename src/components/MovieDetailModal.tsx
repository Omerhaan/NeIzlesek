import { useState, useEffect } from 'react'
import {
  X,
  Star,
  Eye,
  Trash2,
  Calendar,
  RotateCcw,
  Check,
  Play,
  Clock,
  User,
  Heart,
  Ban,
} from 'lucide-react'
import type { Movie, SwipeAction } from '../types'
import {
  LOGO_BASE_URL,
  GENRES,
  formatRuntime,
  fetchMovieDetails,
} from '../services/tmdb'
import { MovieArtwork } from './MovieArtwork'

interface MovieDetailModalProps {
  movie: Movie | null
  listType?: 'liked' | 'watched' | 'preview'
  initialRating?: number
  isOpen: boolean
  onClose: () => void
  onMarkAsWatched?: (movie: Movie, rating?: number) => void
  onRemoveLiked?: (movieId: number) => void
  onUpdateRating?: (movieId: number, rating: number) => void
  onMoveToLiked?: (movie: Movie) => void
  onRemoveWatched?: (movieId: number) => void
  onSwipeFromModal?: (movie: Movie, action: SwipeAction) => void
  canVeto?: boolean
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  10: '🌟 10 - Başyapıt',
  9: '🌟 9 - Harika',
  8: '🌟 8 - Çok İyi',
  7: '👍 7 - İyi',
  6: '👌 6 - Fena Değil',
  5: '😐 5 - Ortalama',
  4: '👎 4 - Vasat',
  3: '👎 3 - Kötü',
  2: '❌ 2 - Çok Kötü',
  1: '💩 1 - Zaman Kaybı',
}

export function MovieDetailModal({
  movie,
  listType = 'liked',
  initialRating,
  isOpen,
  onClose,
  onMarkAsWatched,
  onRemoveLiked,
  onUpdateRating,
  onMoveToLiked,
  onRemoveWatched,
  onSwipeFromModal,
  canVeto = false,
}: MovieDetailModalProps) {
  const [detailedMovie, setDetailedMovie] = useState<Movie | null>(movie)
  const [selectedRating, setSelectedRating] = useState<number | undefined>(initialRating)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false)

  // Fetch full details if trailer, runtime, or cast is missing
  useEffect(() => {
    if (!isOpen || !movie) return

    setDetailedMovie(movie)
    setSelectedRating(initialRating)
    setHoverRating(null)
    setActionNotice(null)
    setIsPlayingTrailer(false)

    if (!movie.trailerKey || !movie.cast || !movie.runtime) {
      fetchMovieDetails(movie.id).then((full) => {
        if (full) {
          setDetailedMovie((prev) => (prev ? { ...prev, ...full } : full))
        }
      })
    }
  }, [movie, initialRating, isOpen])

  if (!isOpen || !detailedMovie) return null

  const releaseYear = detailedMovie.release_date
    ? detailedMovie.release_date.substring(0, 4)
    : ''
  const movieGenres = (detailedMovie.genre_ids || [])
    .map((gId) => GENRES.find((g) => g.id === gId)?.name)
    .filter(Boolean)

  const activeRating = hoverRating !== null ? hoverRating : selectedRating
  const runtimeFormatted = formatRuntime(detailedMovie.runtime)

  const showTemporaryNotice = (msg: string, callback: () => void) => {
    setActionNotice(msg)
    setTimeout(() => {
      callback()
      onClose()
    }, 500)
  }

  const handleMarkWatched = () => {
    showTemporaryNotice('İzlenenlere eklendi! 🎉', () => {
      onMarkAsWatched?.(detailedMovie, selectedRating)
    })
  }

  const handleRemoveLiked = () => {
    showTemporaryNotice('Listeden silindi', () => {
      onRemoveLiked?.(detailedMovie.id)
    })
  }

  const handleSaveRating = () => {
    if (selectedRating !== undefined) {
      showTemporaryNotice('Puan kaydedildi ⭐', () => {
        onUpdateRating?.(detailedMovie.id, selectedRating)
      })
    }
  }

  const handleMoveToLiked = () => {
    showTemporaryNotice('İzleme listesine geri taşındı ❤️', () => {
      onMoveToLiked?.(detailedMovie)
    })
  }

  const handleRemoveWatched = () => {
    showTemporaryNotice('İzlenenlerden silindi', () => {
      onRemoveWatched?.(detailedMovie.id)
    })
  }

  const handleCardSwipe = (action: SwipeAction) => {
    onSwipeFromModal?.(detailedMovie, action)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Action Notice Overlay */}
        {actionNotice && (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-white">{actionNotice}</p>
          </div>
        )}

        {/* Header Backdrop / YouTube Trailer Video */}
        <div className="relative w-full h-48 shrink-0 overflow-hidden bg-zinc-900">
          {isPlayingTrailer && detailedMovie.trailerKey ? (
            <div className="relative w-full h-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${detailedMovie.trailerKey}?autoplay=1&rel=0`}
                title={`${detailedMovie.title} Fragman`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
              <button
                type="button"
                onClick={() => setIsPlayingTrailer(false)}
                className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[10px] font-bold rounded-lg border border-white/20"
              >
                Fragmanı Kapat
              </button>
            </div>
          ) : (
            <>
              <MovieArtwork
                movie={detailedMovie}
                preferBackdrop
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/30" />

              {/* Lazy Trailer Button Overlay */}
              {detailedMovie.trailerKey && (
                <button
                  type="button"
                  onClick={() => setIsPlayingTrailer(true)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs rounded-full shadow-xl shadow-red-600/40 backdrop-blur-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer z-10"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Fragmanı İzle</span>
                </button>
              )}

              {/* Poster & Title Row */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3 z-10">
                <MovieArtwork
                  movie={detailedMovie}
                  className="w-16 h-24 rounded-xl object-cover shadow-2xl border-2 border-zinc-700/60 shrink-0"
                />
                <div className="flex-1 min-w-0 pb-1">
                  <h3 className="text-lg font-black text-white leading-tight truncate">
                    {detailedMovie.title}
                  </h3>
                  {detailedMovie.original_title &&
                    detailedMovie.original_title !== detailedMovie.title && (
                      <p className="text-xs text-zinc-400 italic truncate">
                        {detailedMovie.original_title}
                      </p>
                    )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {detailedMovie.vote_average.toFixed(1)}
                    </span>
                    {releaseYear && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-800">
                        <Calendar className="w-3 h-3" />
                        {releaseYear}
                      </span>
                    )}
                    {runtimeFormatted && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-800">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {runtimeFormatted}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 text-left">
          {/* Genre Badges */}
          {movieGenres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {movieGenres.map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Director & Cast Meta */}
          {(detailedMovie.director || (detailedMovie.cast && detailedMovie.cast.length > 0)) && (
            <div className="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-2xl flex flex-col gap-1.5 text-xs">
              {detailedMovie.director && (
                <div className="flex items-center gap-2 text-zinc-300">
                  <User className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-zinc-500">Yönetmen:</span>
                  <strong className="text-white">{detailedMovie.director}</strong>
                </div>
              )}
              {detailedMovie.cast && detailedMovie.cast.length > 0 && (
                <div className="text-zinc-400 text-[11px] leading-relaxed">
                  <span className="text-zinc-500">Oyuncular: </span>
                  <span className="text-zinc-300 font-medium">
                    {detailedMovie.cast.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Providers with Mandatory JustWatch Attribution */}
          {detailedMovie.providers && detailedMovie.providers.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400">Yayın Platformları:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {detailedMovie.providers.map((p) => (
                    <img
                      key={p.provider_id}
                      src={`${LOGO_BASE_URL}${p.logo_path}`}
                      alt={p.provider_name}
                      title={p.provider_name}
                      className="w-5 h-5 rounded-md object-cover shadow"
                    />
                  ))}
                </div>
              </div>
              <span className="text-[9px] text-zinc-500 italic">
                Yayın akışı verileri JustWatch tarafından sağlanmaktadır.
              </span>
            </div>
          )}

          {/* Overview */}
          <div>
            <span className="text-xs font-bold text-zinc-400 block mb-1">Film Özeti</span>
            <p className="text-xs text-zinc-300 leading-relaxed max-h-24 overflow-y-auto pr-1">
              {detailedMovie.overview || 'Bu film için henüz bir Türkçe özet bulunmuyor.'}
            </p>
          </div>

          {/* Rating Section (only for watchlist management) */}
          {listType !== 'preview' && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {listType === 'watched' ? 'Senin Puanın' : 'Filme Puan Ver (1-10)'}
                </span>
                {selectedRating !== undefined && (
                  <button
                    type="button"
                    onClick={() => setSelectedRating(undefined)}
                    className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Puanı Temizle
                  </button>
                )}
              </div>

              {/* Score Selector (1 to 10) */}
              <div className="grid grid-cols-10 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                  const isSelected = selectedRating === score
                  const isHovered = hoverRating !== null && hoverRating >= score
                  const isLessThanSelected =
                    selectedRating !== undefined && selectedRating >= score

                  return (
                    <button
                      key={score}
                      type="button"
                      onMouseEnter={() => setHoverRating(score)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setSelectedRating(score)}
                      className={`h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 scale-105'
                          : isHovered || isLessThanSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      {score}
                    </button>
                  )
                })}
              </div>

              {/* Active Rating Description Label */}
              <div className="text-center h-4">
                {activeRating ? (
                  <span className="text-xs font-bold text-amber-400 animate-in fade-in">
                    {RATING_DESCRIPTIONS[activeRating] || `⭐ ${activeRating} / 10`}
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-500">
                    Puan seçmek için bir sayıya tıklayın
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex flex-col gap-2">
          {listType === 'preview' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCardSwipe('pass')}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Pas</span>
              </button>

              {canVeto && (
                <button
                  type="button"
                  onClick={() => handleCardSwipe('veto')}
                  className="py-3 px-3 bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  title="Veto Et"
                >
                  <Ban className="w-4 h-4" />
                  <span>Veto</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCardSwipe('watched')}
                className="py-3 px-3 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>İzledim</span>
              </button>

              <button
                type="button"
                onClick={() => handleCardSwipe('like')}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Beğen</span>
              </button>
            </div>
          ) : listType === 'liked' ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRemoveLiked}
                className="py-3 px-4 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-800/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Listeden Sil</span>
              </button>

              <button
                type="button"
                onClick={handleMarkWatched}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>
                  {selectedRating
                    ? `İzledim (${selectedRating}★ Kaydet)`
                    : 'İzledim Olarak İşaretle'}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleMoveToLiked}
                  className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>İzleme Listesine Geri Taşı</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveWatched}
                  className="py-2.5 px-3 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-800/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>İzlenenlerden Sil</span>
                </button>
              </div>

              {selectedRating !== initialRating && selectedRating !== undefined && (
                <button
                  type="button"
                  onClick={handleSaveRating}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-black" />
                  <span>Yeni Puanı Güncelle ({selectedRating}/10)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
