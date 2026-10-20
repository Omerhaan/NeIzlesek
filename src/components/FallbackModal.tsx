import { useState, useEffect } from 'react'
import { Sparkles, Trophy, Star, ArrowRight, Loader2, X } from 'lucide-react'
import type { Movie } from '../types'
import { fetchMovieDetails, fetchRecommendationsByGenres } from '../services/tmdb'
import { fetchRoomRoundLikes, fetchRoomSharedTasteGenres, setRoomMatchedMovie } from '../services/supabase'
import { MovieArtwork } from './MovieArtwork'

interface FallbackModalProps {
  roomId: string
  roundNumber: number
  isOpen: boolean
  onClose: () => void
  onSelectMovie: (movie: Movie) => void
  onNextRound?: () => void
}

export function FallbackModal({
  roomId,
  roundNumber,
  isOpen,
  onClose,
  onSelectMovie,
  onNextRound,
}: FallbackModalProps) {
  const [sharedMovies, setSharedMovies] = useState<Movie[]>([])
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectingId, setSelectingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen || !roomId) return

    let isMounted = true
    setIsLoading(true)

    async function loadFallbackMovies() {
      try {
        const { sharedLikeIds, likedMovieIds, styleSeedIds, vetoedMovieIds } = await fetchRoomRoundLikes(roomId, roundNumber)
        const sharedDetails = await Promise.all(sharedLikeIds.map((id) => fetchMovieDetails(id, false)))
        const validShared = sharedDetails.filter((movie): movie is Movie => movie !== null)
        const seedIds = (sharedLikeIds.length > 0 ? sharedLikeIds : styleSeedIds.length > 0 ? styleSeedIds : likedMovieIds)
          .filter((id) => !vetoedMovieIds.includes(id))
          .slice(0, 6)
        const sharedById = new Map(validShared.map((movie) => [movie.id, movie]))
        const extraSeeds = await Promise.all(
          seedIds.filter((id) => !sharedById.has(id)).map((id) => fetchMovieDetails(id, false))
        )
        const genreCounts = new Map<number, number>()
        for (const movie of [...validShared, ...extraSeeds.filter((movie): movie is Movie => movie !== null)]) {
          for (const genreId of movie.genre_ids) genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + 1)
        }
        const inferredGenres = Array.from(genreCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([genreId]) => genreId)
        const sharedTasteGenres = await fetchRoomSharedTasteGenres(roomId).catch(() => [])
        const topGenres = sharedTasteGenres.length > 0 ? sharedTasteGenres : inferredGenres
        const recommendedMovies = await fetchRecommendationsByGenres(
          topGenres,
          [...likedMovieIds, ...vetoedMovieIds],
          12
        )

        if (isMounted) {
          setSharedMovies(validShared)
          setRecommendations(recommendedMovies)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load fallback movies:', err)
        if (isMounted) setIsLoading(false)
      }
    }

    loadFallbackMovies()

    return () => {
      isMounted = false
    }
  }, [isOpen, roomId, roundNumber])

  if (!isOpen) return null

  const handlePickMovie = async (movie: Movie) => {
    setSelectingId(movie.id)
    try {
      await setRoomMatchedMovie(roomId, movie.id)
      onSelectMovie(movie)
      onClose()
    } catch (err) {
      console.error('Failed to set matched movie:', err)
    } finally {
      setSelectingId(null)
    }
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

        {/* Header */}
        <div className="pt-6 pb-3 px-5 text-center bg-gradient-to-b from-amber-950/30 to-transparent">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Tur Sonu • Ortak Seçimler</span>
          </div>
          <h2 className="text-xl font-black text-white">Bu Akşam Ne İzleyelim?</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Tur bitince ortak beğenilerinizi ve birlikte sevdiğiniz türlerden önerileri görün.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs font-medium">Ortak adaylar hesaplanıyor...</span>
            </div>
          ) : sharedMovies.length === 0 && recommendations.length === 0 ? (
            <div className="py-12 px-4 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="font-semibold text-white mb-1">Öneri oluşturacak veri bulunamadı</p>
              <p>Yeni bir turda beğenilerinizi kaydettikçe daha iyi öneriler sunabiliriz.</p>
            </div>
          ) : (
            <>
            {sharedMovies.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-emerald-300">İkinizin de beğendiği filmler</h3>
                {sharedMovies.map((movie, index) => (
                  <MovieChoice key={movie.id} movie={movie} index={index} selectingId={selectingId} onSelect={handlePickMovie} shared />
                ))}
              </>
            )}
            {recommendations.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-amber-300 mt-2">Ortak zevkinize göre öneriler</h3>
                {recommendations.map((movie, index) => (
                  <MovieChoice key={movie.id} movie={movie} index={index} selectingId={selectingId} onSelect={handlePickMovie} />
                ))}
              </>
            )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-center">
          <button
            type="button"
            onClick={() => {
              onClose()
              onNextRound?.()
            }}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç ve Sıradaki Tura Geç
          </button>
        </div>
      </div>
    </div>
  )
}

function MovieChoice({
  movie,
  index,
  selectingId,
  onSelect,
  shared = false,
}: {
  movie: Movie
  index: number
  selectingId: number | null
  onSelect: (movie: Movie) => void
  shared?: boolean
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3 flex items-center gap-3.5 transition-all shadow-md group">
      <div className="relative w-16 h-22 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-zinc-800">
        <MovieArtwork movie={movie} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full ${shared ? 'bg-emerald-400' : 'bg-amber-500'} text-black font-black text-[11px] flex items-center justify-center shadow`}>
          {shared ? '♥' : `#${index + 1}`}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white leading-tight truncate">{movie.title}</h4>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <Star className="w-3 h-3 fill-amber-400" />{movie.vote_average.toFixed(1)}
          </span>
          {movie.release_date && <span className="text-[10px] text-zinc-400 font-mono">{movie.release_date.substring(0, 4)}</span>}
        </div>
      </div>
      <button
        type="button"
        disabled={selectingId !== null}
        onClick={() => onSelect(movie)}
        className="px-3.5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-transform active:scale-95 cursor-pointer shrink-0"
      >
        {selectingId === movie.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Seç</span><ArrowRight className="w-3.5 h-3.5" /></>}
      </button>
    </div>
  )
}
