import { useState, useEffect, useRef } from 'react'
import { Search, X, Star, Heart, Eye, Film, Loader2, Sparkles } from 'lucide-react'
import type { Movie } from '../types'
import { searchMovies } from '../services/tmdb'
import { MovieArtwork } from './MovieArtwork'
import { hapticLike, hapticWatched } from '../utils/haptics'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenDetails: (movie: Movie) => void
  onLikeMovie: (movie: Movie) => void
  onWatchMovie: (movie: Movie, rating?: number) => void
  isLiked: (movieId: number) => boolean
  isWatched: (movieId: number) => boolean
  getWatchedRating?: (movieId: number) => number | undefined
}

const TRENDING_SUGGESTIONS = [
  'Interstellar',
  'Dune',
  'Oppenheimer',
  'The Dark Knight',
  'Fight Club',
  'Spirited Away',
]

export function GlobalSearchModal({
  isOpen,
  onClose,
  onOpenDetails,
  onLikeMovie,
  onWatchMovie,
  isLiked,
  isWatched,
  getWatchedRating,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [ratingMovieId, setRatingMovieId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setRatingMovieId(null)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const data = await searchMovies(trimmed)
        setResults(data)
      } catch (err) {
        console.error('Search error:', err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => clearTimeout(timeout)
  }, [query])

  if (!isOpen) return null

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    inputRef.current?.focus()
  }

  const handleLike = (movie: Movie) => {
    hapticLike()
    onLikeMovie(movie)
  }

  const handleWatch = (movie: Movie, rating?: number) => {
    hapticWatched()
    onWatchMovie(movie, rating)
    setRatingMovieId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg h-[85dvh] max-h-[720px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header & Search Input */}
        <div className="p-4 border-b border-zinc-800/80 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-white">Film Ara & Listene Ekle</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Film adı, seri veya yönetmen ara..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Suggestion Chips */}
          {!query && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <span className="text-[11px] text-zinc-500 font-semibold shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Popüler:
              </span>
              {TRENDING_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-medium whitespace-nowrap transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="text-xs">Filmler taranıyor...</span>
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 text-zinc-500 text-center px-4">
              <Film className="w-10 h-10 text-zinc-700 stroke-1" />
              <p className="text-sm font-semibold text-zinc-400">"{query}" ile film bulunamadı</p>
              <p className="text-xs text-zinc-600">Yazımı kontrol et veya farklı bir anahtar kelime dene.</p>
            </div>
          ) : !query.trim() ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center gap-2 text-zinc-500 text-center px-6">
              <Film className="w-12 h-12 text-zinc-800 stroke-1" />
              <p className="text-sm font-semibold text-zinc-400">Milyonlarca Film Arasında Ara</p>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-xs">
                İzlediğin veya izlemek istediğin filmleri aratarak hemen profiline ekleyebilir ve puanlayabilirsin.
              </p>
            </div>
          ) : (
            results.map((movie) => {
              const liked = isLiked(movie.id)
              const watched = isWatched(movie.id)
              const rating = getWatchedRating?.(movie.id)
              const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : ''
              const isRatingThis = ratingMovieId === movie.id

              return (
                <div
                  key={movie.id}
                  className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2.5 transition-all hover:border-zinc-700"
                >
                  <div className="flex gap-3">
                    {/* Poster Thumbnail */}
                    <div
                      onClick={() => onOpenDetails(movie)}
                      className="w-16 h-24 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-800 cursor-pointer relative group"
                    >
                      <MovieArtwork
                        movie={movie}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h3
                            onClick={() => onOpenDetails(movie)}
                            className="font-bold text-sm text-white hover:text-red-400 transition-colors line-clamp-1 cursor-pointer"
                          >
                            {movie.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 font-medium">
                          {releaseYear && <span>{releaseYear}</span>}
                          {movie.vote_average > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {movie.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {movie.overview && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                            {movie.overview}
                          </p>
                        )}
                      </div>

                      {/* Action buttons row */}
                      <div className="flex items-center gap-2 mt-2 pt-1 border-t border-zinc-800/60">
                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={() => handleLike(movie)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            liked
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-400' : ''}`} />
                          <span>{liked ? 'Listede' : 'İzle'}</span>
                        </button>

                        {/* Watched Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isRatingThis) {
                              setRatingMovieId(null)
                            } else {
                              setRatingMovieId(movie.id)
                            }
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            watched
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {watched
                              ? rating
                                ? `İzlendi (${rating}★)`
                                : 'İzlendi'
                              : 'İzledim'}
                          </span>
                        </button>

                        {/* Details / Trailer button */}
                        <button
                          type="button"
                          onClick={() => onOpenDetails(movie)}
                          className="py-1.5 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer border border-zinc-700/60"
                          title="Fragman ve Detaylar"
                        >
                          Detay
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline 1-10 Star Rating Selector when rating this movie */}
                  {isRatingThis && (
                    <div className="bg-zinc-950 border border-purple-500/30 rounded-xl p-2.5 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                        <span>Filmi Puanla (1-10):</span>
                        <button
                          type="button"
                          onClick={() => handleWatch(movie, undefined)}
                          className="text-zinc-500 hover:text-zinc-300 text-[10px] cursor-pointer"
                        >
                          Puansız Kaydet
                        </button>
                      </div>
                      <div className="grid grid-cols-10 gap-1 pt-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleWatch(movie, star)}
                            className={`py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                              rating === star
                                ? 'bg-amber-400 text-black shadow-md'
                                : 'bg-zinc-900 hover:bg-amber-400/20 text-zinc-300 hover:text-amber-300 border border-zinc-800'
                            }`}
                          >
                            {star}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
