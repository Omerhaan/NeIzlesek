import type { Movie, StreamingProvider } from '../types'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ''
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280'
export const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w92'

export const GENRES = [
  { id: 0, name: 'Tümü' },
  { id: 28, name: 'Aksiyon' },
  { id: 35, name: 'Komedi' },
  { id: 18, name: 'Dram' },
  { id: 27, name: 'Korku' },
  { id: 10749, name: 'Romantik' },
  { id: 878, name: 'Bilim Kurgu' },
  { id: 53, name: 'Gerilim' },
  { id: 16, name: 'Animasyon' },
  { id: 12, name: 'Macera' },
  { id: 80, name: 'Suç' },
  { id: 9648, name: 'Gizem' },
]

export interface StreamingPlatformDef {
  id: number
  name: string
  logo: string
}

export const POPULAR_PLATFORMS: StreamingPlatformDef[] = [
  { id: 8, name: 'Netflix', logo: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
  { id: 119, name: 'Prime Video', logo: '/pvsI0A9r1s5s6n9K8g7Y2W5X1X2.jpg' },
  { id: 337, name: 'Disney+', logo: '/7rwgQI5a1t9OnRydqywIdyvKyRp.jpg' },
  { id: 442, name: 'BluTV', logo: '/f5bF1Y1b1y1Y1b1Y1b1Y1b1Y1b1.jpg' },
  { id: 350, name: 'Apple TV+', logo: '/2E03qsvDCvENQpnbtq4Q964Q2Tr.jpg' },
  { id: 2235, name: 'tabii', logo: '/8OIs6ZVYbS3auTiW6cWsXE5LTX.png' },
]

export type YearRange = 'all' | '2020+' | '2010s' | '2000s' | 'classic'

export interface FilterState {
  genreId: number
  platformIds: number[]
  yearRange: YearRange
  minRating: number // 0, 7.0, 7.5, 8.0
}

export const DEFAULT_FILTERS: FilterState = {
  genreId: 0,
  platformIds: [],
  yearRange: 'all',
  minRating: 0,
}

export async function fetchPopularMovies(page = 1, genreId = 0): Promise<Movie[]> {
  try {
    let url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=tr-TR&region=TR&sort_by=popularity.desc&include_adult=false&vote_count.gte=50&page=${page}`
    if (genreId > 0) {
      url += `&with_genres=${genreId}`
    }

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`TMDb API error: ${res.statusText}`)
    }

    const data = await res.json()
    const rawMovies = data.results || []

    // Filter movies that have posters and descriptions
    return rawMovies
      .filter((m: { poster_path: string | null; overview: string }) => m.poster_path && m.overview)
      .map((m: any) => ({
        id: m.id,
        title: m.title || m.original_title,
        original_title: m.original_title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: Math.round(m.vote_average * 10) / 10,
        release_date: m.release_date || '',
        genre_ids: m.genre_ids || [],
      }))
  } catch (error) {
    console.error('Failed to fetch movies from TMDb:', error)
    return []
  }
}

export async function fetchFilteredMovies(
  page = 1,
  filters: FilterState = DEFAULT_FILTERS
): Promise<Movie[]> {
  try {
    let url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=tr-TR&region=TR&sort_by=popularity.desc&include_adult=false&vote_count.gte=30&page=${page}`

    if (filters.genreId > 0) {
      url += `&with_genres=${filters.genreId}`
    }

    if (filters.platformIds && filters.platformIds.length > 0) {
      url += `&with_watch_providers=${filters.platformIds.join('|')}&watch_region=TR`
    }

    if (filters.minRating > 0) {
      url += `&vote_average.gte=${filters.minRating}`
    }

    if (filters.yearRange === '2020+') {
      url += `&primary_release_date.gte=2020-01-01`
    } else if (filters.yearRange === '2010s') {
      url += `&primary_release_date.gte=2010-01-01&primary_release_date.lte=2019-12-31`
    } else if (filters.yearRange === '2000s') {
      url += `&primary_release_date.gte=2000-01-01&primary_release_date.lte=2009-12-31`
    } else if (filters.yearRange === 'classic') {
      url += `&primary_release_date.lte=1999-12-31`
    }

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`TMDb API error: ${res.statusText}`)
    }

    const data = await res.json()
    const rawMovies = data.results || []

    return rawMovies
      .filter((m: { poster_path: string | null; overview: string }) => m.poster_path && m.overview)
      .map((m: any) => ({
        id: m.id,
        title: m.title || m.original_title,
        original_title: m.original_title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: Math.round(m.vote_average * 10) / 10,
        release_date: m.release_date || '',
        genre_ids: m.genre_ids || [],
      }))
  } catch (error) {
    console.error('Failed to fetch filtered movies:', error)
    return []
  }
}

export async function fetchMovieProviders(movieId: number): Promise<StreamingProvider[]> {
  try {
    const url = `${BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json()
    const trData = data.results?.TR
    if (!trData) return []

    // Prioritize flatrate (subscription), fallback to rent/buy
    const providers = trData.flatrate || trData.rent || trData.buy || []
    return providers.map((p: any) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: p.logo_path,
    }))
  } catch (err) {
    console.error('Failed to fetch providers for movie', movieId, err)
    return []
  }
}

export function formatRuntime(minutes?: number): string {
  if (!minutes || minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`
  }
  return `${mins} dk`
}

export async function fetchMovieDetails(movieId: number): Promise<Movie | null> {
  try {
    const url = `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=videos,credits&include_video_language=tr,en,null`
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const providers = await fetchMovieProviders(movieId)

    // Find best trailer (prefer Turkish trailer, then English trailer, then any YouTube video)
    const videos: any[] = data.videos?.results || []
    let trailerKey: string | undefined

    const trTrailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.iso_639_1 === 'tr'
    )
    const enTrailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    )
    const anyTrailer = videos.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )
    const fallbackVideo = videos.find((v) => v.site === 'YouTube')

    trailerKey = (trTrailer || enTrailer || anyTrailer || fallbackVideo)?.key

    // Director
    const director = data.credits?.crew?.find((c: any) => c.job === 'Director')?.name

    // Top 5 cast members
    const cast = (data.credits?.cast || []).slice(0, 5).map((c: any) => c.name as string)

    return {
      id: data.id,
      title: data.title || data.original_title,
      original_title: data.original_title,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      vote_average: Math.round(data.vote_average * 10) / 10,
      release_date: data.release_date || '',
      genre_ids: data.genres ? data.genres.map((g: any) => g.id) : [],
      providers,
      runtime: data.runtime || undefined,
      trailerKey,
      director,
      cast,
    }
  } catch (err) {
    console.error('Failed to fetch movie details:', err)
    return null
  }
}

export async function fetchNowPlayingMovies(): Promise<Movie[]> {
  try {
    const url = `${BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=tr-TR&region=TR&page=1`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || [])
      .filter((m: any) => m.poster_path && m.overview)
      .map((m: any) => ({
        id: m.id,
        title: m.title || m.original_title,
        original_title: m.original_title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: Math.round(m.vote_average * 10) / 10,
        release_date: m.release_date || '',
        genre_ids: m.genre_ids || [],
      }))
  } catch (err) {
    console.error('Failed to fetch now playing movies:', err)
    return []
  }
}

export async function fetchUpcomingMovies(): Promise<Movie[]> {
  try {
    const url = `${BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=tr-TR&region=TR&page=1`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || [])
      .filter((m: any) => m.poster_path && m.overview)
      .map((m: any) => ({
        id: m.id,
        title: m.title || m.original_title,
        original_title: m.original_title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: Math.round(m.vote_average * 10) / 10,
        release_date: m.release_date || '',
        genre_ids: m.genre_ids || [],
      }))
  } catch (err) {
    console.error('Failed to fetch upcoming movies:', err)
    return []
  }
}

