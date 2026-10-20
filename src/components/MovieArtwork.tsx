import { useEffect, useMemo, useState } from 'react'
import { Film } from 'lucide-react'
import type { Movie } from '../types'
import { TMDB_IMAGE_BASE_URL } from '../services/tmdb'

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
  const sources = useMemo(() => {
    const posterSizes = ['w500', 'w342', 'w185', 'original']
    const backdropSizes = ['w1280', 'w780', 'w500', 'original']
    const posterSources = movie.poster_path
      ? posterSizes.map((size) => `${TMDB_IMAGE_BASE_URL}/${size}${movie.poster_path}`)
      : []
    const backdropSources = movie.backdrop_path
      ? backdropSizes.map((size) => `${TMDB_IMAGE_BASE_URL}/${size}${movie.backdrop_path}`)
      : []
    const orderedSources = preferBackdrop
      ? [...backdropSources, ...posterSources]
      : [...posterSources, ...backdropSources]
    return [...new Set(orderedSources)]
  }, [movie.poster_path, movie.backdrop_path, preferBackdrop])
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => setSourceIndex(0), [movie.id, sources])

  if (sourceIndex >= sources.length) {
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

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt ?? movie.title}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  )
}
