import { useState, useEffect } from 'react'
import { Star, Info, Calendar, Film } from 'lucide-react'
import type { Movie } from '../types'
import { IMAGE_BASE_URL, BACKDROP_BASE_URL, LOGO_BASE_URL } from '../services/tmdb'

interface MovieCardProps {
  movie: Movie
  isTopCard: boolean
  dragOffset: { x: number; y: number }
  isDragging: boolean
  onOpenDetails?: (movie: Movie) => void
}

export function MovieCard({
  movie,
  isTopCard,
  dragOffset,
  isDragging,
  onOpenDetails,
}: MovieCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (movie.poster_path) return `${IMAGE_BASE_URL}${movie.poster_path}`
    if (movie.backdrop_path) return `${BACKDROP_BASE_URL}${movie.backdrop_path}`
    return ''
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Reset and update image source whenever movie changes
  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
    if (movie.poster_path) {
      setImgSrc(`${IMAGE_BASE_URL}${movie.poster_path}`)
    } else if (movie.backdrop_path) {
      setImgSrc(`${BACKDROP_BASE_URL}${movie.backdrop_path}`)
    } else {
      setHasError(true)
    }
  }, [movie.id, movie.poster_path, movie.backdrop_path])

  const handleImageError = () => {
    // If primary poster failed, try backdrop image as fallback
    if (movie.backdrop_path && imgSrc !== `${BACKDROP_BASE_URL}${movie.backdrop_path}`) {
      setImgSrc(`${BACKDROP_BASE_URL}${movie.backdrop_path}`)
    } else {
      setHasError(true)
    }
  }

  // Compute rotation and translation if it's the top card being dragged
  const rotation = isTopCard ? (dragOffset.x / 15) : 0
  const transformStyle = isTopCard
    ? {
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    : {}

  // Drag threshold for stamping feedback
  const swipeDirection =
    dragOffset.y > 60 && Math.abs(dragOffset.x) < 40
      ? 'veto'
      : dragOffset.x > 50
      ? 'like'
      : dragOffset.x < -50
      ? 'pass'
      : null

  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : ''

  return (
    <div
      style={transformStyle}
      className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-end select-none pointer-events-auto transition-transform ${
        isTopCard ? 'z-20 cursor-grab active:cursor-grabbing' : 'z-10 scale-[0.96] -translate-y-3 opacity-80'
      }`}
    >
      {/* Background Poster Image / Skeleton / Fallback */}
      {!hasError && imgSrc ? (
        <>
          {/* Skeleton Shimmer while loading */}
          {!isLoaded && (
            <div className="absolute inset-0 w-full h-full bg-zinc-800/80 animate-pulse flex items-center justify-center">
              <Film className="w-12 h-12 text-zinc-600 animate-bounce" />
            </div>
          )}

          <img
            src={imgSrc}
            alt={movie.title}
            draggable={false}
            loading={isTopCard ? 'eager' : 'lazy'}
            fetchPriority={isTopCard ? 'high' : 'auto'}
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        /* Cinematic fallback when poster is missing or fails to load */
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex flex-col items-center justify-center p-8 text-center select-none pointer-events-none">
          <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-zinc-400 shadow-inner">
            <Film className="w-10 h-10 stroke-[1.5]" />
          </div>
          <span className="text-2xl font-black text-white leading-tight line-clamp-3 mb-2">
            {movie.title}
          </span>
          {movie.original_title && movie.original_title !== movie.title && (
            <span className="text-xs text-zinc-400 italic line-clamp-1 mb-2">
              {movie.original_title}
            </span>
          )}
          <span className="text-[11px] text-zinc-500 font-medium px-3 py-1 bg-zinc-900/80 rounded-full border border-zinc-800">
            Afiş Bağlantısı Bekleniyor
          </span>
        </div>
      )}

      {/* Subtle top shadow */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

      {/* Bottom Gradient Overlay for readability */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none" />

      {/* Swipe Feedback Stamp Badges */}
      {isTopCard && swipeDirection === 'like' && (
        <div
          className="absolute top-10 left-8 border-4 border-emerald-400 text-emerald-400 font-black text-2xl md:text-3xl px-4 py-1.5 rounded-xl -rotate-15 uppercase tracking-wider shadow-lg bg-black/40 backdrop-blur-sm pointer-events-none animate-pulse"
          style={{ opacity: Math.min(1, Math.abs(dragOffset.x) / 100) }}
        >
          BEĞEN
        </div>
      )}

      {isTopCard && swipeDirection === 'pass' && (
        <div
          className="absolute top-10 right-8 border-4 border-rose-500 text-rose-500 font-black text-2xl md:text-3xl px-4 py-1.5 rounded-xl rotate-15 uppercase tracking-wider shadow-lg bg-black/40 backdrop-blur-sm pointer-events-none animate-pulse"
          style={{ opacity: Math.min(1, Math.abs(dragOffset.x) / 100) }}
        >
          PAS
        </div>
      )}

      {isTopCard && swipeDirection === 'veto' && (
        <div
          className="absolute top-10 inset-x-8 border-4 border-red-600 text-red-500 font-black text-2xl md:text-3xl px-4 py-1.5 rounded-xl uppercase tracking-wider shadow-2xl bg-black/80 backdrop-blur-sm pointer-events-none text-center animate-pulse z-30"
        >
          🚫 VETO
        </div>
      )}

      {/* Streaming Platform Badges (Top Right) */}
      {movie.providers && movie.providers.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
          {movie.providers.slice(0, 3).map((provider) => (
            <img
              key={provider.provider_id}
              src={`${LOGO_BASE_URL}${provider.logo_path}`}
              alt={provider.provider_name}
              title={provider.provider_name}
              className="w-5 h-5 rounded-md object-cover shadow"
            />
          ))}
          {movie.providers.length > 3 && (
            <span className="text-[10px] text-zinc-300 font-bold ml-0.5">
              +{movie.providers.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Card Content Footer */}
      <div className="relative z-10 p-5 pb-6 text-left flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              {movie.title}
            </h2>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-xs text-zinc-400 font-medium italic mt-0.5">
                {movie.original_title}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (onOpenDetails) {
                onOpenDetails(movie)
              } else {
                setShowDetails((prev) => !prev)
              }
            }}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700 shadow-md"
            title="Detaylar & Fragman"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Rating and Year Meta */}
        <div className="flex items-center gap-3 text-xs font-semibold text-zinc-300">
          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/30">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {movie.vote_average.toFixed(1)}
          </span>

          {releaseYear && (
            <span className="flex items-center gap-1 bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {releaseYear}
            </span>
          )}
        </div>

        {/* Overview (expandable or clamped) */}
        <div className="mt-1">
          <p
            className={`text-sm text-zinc-300 leading-relaxed font-normal transition-all duration-200 ${
              showDetails ? 'max-h-48 overflow-y-auto pr-1' : 'line-clamp-2'
            }`}
          >
            {movie.overview}
          </p>
        </div>
      </div>
    </div>
  )
}
