import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { SwipeDeck } from './components/SwipeDeck'
import { MatchModal } from './components/MatchModal'
import { NewsFeed } from './components/NewsFeed'
import { UserProfile } from './components/UserProfile'
import { BottomNav, type NavTab } from './components/BottomNav'
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
  GENRES,
} from './services/tmdb'
import type { Movie, Room, SwipeAction } from './types'

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('match')
  const [room, setRoom] = useState<Room | null>(null)
  const [selectedGenre, setSelectedGenre] = useState(0)
  const [movies, setMovies] = useState<Movie[]>([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null)
  const [isMatchOpen, setIsMatchOpen] = useState(false)
  const [likedMovies, setLikedMovies] = useState<Movie[]>([])

  const userId = useRef(getOrCreateUserId()).current

  // Load a batch of 20 movies for the round
  const loadRoundMovies = useCallback(
    async (pageNum: number, genreId: number) => {
      setIsLoading(true)
      try {
        const fetched = await fetchPopularMovies(pageNum, genreId)

        // Enrich the top 6 movies with streaming providers immediately
        const enriched = await Promise.all(
          fetched.slice(0, 20).map(async (m, idx) => {
            if (idx < 6) {
              const providers = await fetchMovieProviders(m.id)
              return { ...m, providers }
            }
            return m
          })
        )

        setMovies(enriched)
        setPage(pageNum)
      } catch (err) {
        console.error('Failed to load movies:', err)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Initialize movies on mount
  useEffect(() => {
    loadRoundMovies(1, selectedGenre)
  }, [loadRoundMovies, selectedGenre])

  // Check URL query parameters for ?room=CODE on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRoomCode = params.get('room')
    if (urlRoomCode) {
      getRoomByCode(urlRoomCode).then((foundRoom) => {
        if (foundRoom) {
          setRoom(foundRoom)
          setActiveTab('match')
        }
      })
    }
  }, [])

  // Listen to Supabase Realtime when an active room is set
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

  const handleRoomCreatedOrJoined = (newRoom: Room) => {
    setRoom(newRoom)
  }

  const handleLeaveRoom = () => {
    setRoom(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleSwipe = async (movie: Movie, action: SwipeAction) => {
    if (action === 'like') {
      setLikedMovies((prev) => {
        if (prev.some((m) => m.id === movie.id)) return prev
        return [movie, ...prev]
      })
    }

    if (room) {
      try {
        await recordSwipe(room.id, userId, movie.id, action)
      } catch (err) {
        console.error('Swipe record error:', err)
      }
    }
  }

  const handleLoadNextRound = () => {
    const nextPage = page + 1
    setRoundNumber((prev) => prev + 1)
    loadRoundMovies(nextPage, selectedGenre)
  }

  const handleGenreChange = (genreId: number) => {
    setSelectedGenre(genreId)
    setRoundNumber(1)
    loadRoundMovies(1, genreId)
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* App Header */}
      <Header
        roomCode={room ? room.room_code : null}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
      />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'news' && <NewsFeed />}

        {activeTab === 'match' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Genre Filter Bar in Match View */}
            <div className="w-full max-w-md mx-auto px-4 pt-1 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none z-10">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGenreChange(g.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedGenre === g.id
                      ? 'bg-red-600 text-white border-red-500 shadow-sm'
                      : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {/* Swipe Deck with 20 Card Limit & Centered 3 Buttons */}
            <SwipeDeck
              movies={movies}
              onSwipe={handleSwipe}
              onLoadNextRound={handleLoadNextRound}
              onResetGenre={() => handleGenreChange(0)}
              isLoading={isLoading}
              roundNumber={roundNumber}
              roundLimit={20}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <UserProfile
            userId={userId}
            activeRoom={room}
            onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
            onLeaveRoom={handleLeaveRoom}
            onNavigateToMatch={() => setActiveTab('match')}
            likedMovies={likedMovies}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasActiveRoom={!!room}
      />

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
