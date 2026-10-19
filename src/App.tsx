import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { RoomLobby } from './components/RoomLobby'
import { SwipeDeck } from './components/SwipeDeck'
import { MatchModal } from './components/MatchModal'
import {
  getOrCreateUserId,
  recordSwipe,
  subscribeToRoom,
  getRoomByCode,
} from './services/supabase'
import {
  fetchPopularMovies,
  fetchMovieDetails,
  fetchMovieProviders,
} from './services/tmdb'
import type { Movie, Room, SwipeAction } from './types'

export function App() {
  const [inLobby, setInLobby] = useState(true)
  const [room, setRoom] = useState<Room | null>(null)
  const [selectedGenre, setSelectedGenre] = useState(0)
  const [movies, setMovies] = useState<Movie[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null)
  const [isMatchOpen, setIsMatchOpen] = useState(false)

  const userId = useRef(getOrCreateUserId()).current

  // Load movies from TMDb
  const loadMovies = useCallback(
    async (pageNum: number, genreId: number, append = true) => {
      if (isLoading) return
      setIsLoading(true)
      try {
        const fetched = await fetchPopularMovies(pageNum, genreId)

        // Enrich the first 5 movies with streaming providers immediately
        const enriched = await Promise.all(
          fetched.map(async (m, idx) => {
            if (idx < 5) {
              const providers = await fetchMovieProviders(m.id)
              return { ...m, providers }
            }
            return m
          })
        )

        setMovies((prev) => (append ? [...prev, ...enriched] : enriched))
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load movies:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading]
  )

  // Check URL query parameters for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRoomCode = params.get('room')
    if (urlRoomCode) {
      getRoomByCode(urlRoomCode).then((foundRoom) => {
        if (foundRoom) {
          handleJoinRoom(foundRoom)
        }
      })
    }
  }, [])

  // Listen to Supabase Realtime when in an active room
  useEffect(() => {
    if (!room) return

    const unsubscribe = subscribeToRoom(room.id, async (matchedMovieId) => {
      const details = await fetchMovieDetails(matchedMovieId)
      if (details) {
        setMatchedMovie(details)
        setIsMatchOpen(true)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [room])

  const handleJoinRoom = (targetRoom: Room) => {
    setRoom(targetRoom)
    setInLobby(false)
    loadMovies(1, selectedGenre, false)
  }

  const handleStartSolo = (genreId: number) => {
    setRoom(null)
    setSelectedGenre(genreId)
    setInLobby(false)
    loadMovies(1, genreId, false)
  }

  const handleLeaveRoom = () => {
    setRoom(null)
    setInLobby(true)
    setMovies([])
    setPage(1)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleSwipe = async (movie: Movie, action: SwipeAction) => {
    if (room) {
      try {
        await recordSwipe(room.id, userId, movie.id, action)
      } catch (err) {
        console.error('Swipe record error:', err)
      }
    } else {
      // Solo mode: if superlike or like, we can treat it as a personal match or keep swiping
      if (action === 'superlike') {
        const details = await fetchMovieDetails(movie.id)
        if (details) {
          setMatchedMovie(details)
          setIsMatchOpen(true)
        }
      }
    }
  }

  const handleLoadMore = () => {
    loadMovies(page + 1, selectedGenre, true)
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* App Header */}
      <Header
        roomCode={room ? room.room_code : null}
        onLeaveRoom={!inLobby ? handleLeaveRoom : undefined}
      />

      {/* Main View Area */}
      {inLobby ? (
        <RoomLobby
          onJoinRoom={handleJoinRoom}
          onStartSolo={handleStartSolo}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />
      ) : (
        <SwipeDeck
          movies={movies}
          onSwipe={handleSwipe}
          onLoadMore={handleLoadMore}
          isLoading={isLoading}
        />
      )}

      {/* Match Celebration Modal */}
      <MatchModal
        movie={matchedMovie}
        isOpen={isMatchOpen}
        onClose={() => setIsMatchOpen(false)}
      />
    </div>
  )
}

export default App
