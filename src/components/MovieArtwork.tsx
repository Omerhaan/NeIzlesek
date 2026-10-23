import { useEffect, useMemo, useState } from 'react'
import { Film } from 'lucide-react'
import type { Movie } from '../types'
import { getMovieImageCandidates } from '../services/tmdb'

interface MovieArtworkProps {
  movie: Movie
  className?: string
  preferBackdrop?: boolean
  alt?: string
  loading?: 'eager' | 'lazy'
}

export function MovieArtwork({
  movie,
  className = '',
  preferBackdrop = false,
  alt,
  loading = 'lazy',
}: MovieArtworkProps) {
  const sources = useMemo(
    () => getMovieImageCandidates(movie, preferBackdrop),
    [movie.id, movie.poster_path, movie.backdrop_path, preferBackdrop]
  )
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [movie.id, sources])

  if (sourceIndex >= sources.length || sources.length === 0) {
    return (
      <div
        role="img"
        aria-label={alt ?? movie.title}
        className={`bg-zinc-900 flex items-center justify-center text-zinc-600 ${className}`}
      >
        <Film className="w-1/4 h-1/4 min-w-5 min-h-5" aria-hidden="true" />
      </div>
    )
  }

  const currentSrc = sources[sourceIndex]

  return (
    <img
      key={currentSrc}
      src={currentSrc}
      alt={alt ?? movie.title}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  )
}
