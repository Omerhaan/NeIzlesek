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
]

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

export async function fetchMovieDetails(movieId: number): Promise<Movie | null> {
  try {
    const url = `${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=tr-TR`
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const providers = await fetchMovieProviders(movieId)

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

