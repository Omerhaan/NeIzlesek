export interface StreamingProvider {
  provider_id: number
  provider_name: string
  logo_path: string
}

export interface Movie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date: string
  genre_ids: number[]
  providers?: StreamingProvider[]
  runtime?: number // in minutes
  trailerKey?: string // YouTube video ID
  director?: string
  cast?: string[]
}

export type SwipeAction = 'pass' | 'like' | 'superlike' | 'watched' | 'veto'

export interface WatchedMovieEntry {
  movie: Movie
  rating?: number // 1 to 10
  watchedAt: string // ISO timestamp
}

export interface Room {
  id: string
  room_code: string
  status: 'waiting' | 'active' | 'matched'
  matched_movie_id: number | null
  room_deck?: number[]
  round_number?: number
  created_at: string
  updated_at?: string
}

export interface RoomSwipe {
  id?: string
  room_id: string
  user_name: string
  movie_id: number
  action: SwipeAction
  round_number?: number
  created_at?: string
}
