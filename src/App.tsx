import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { SwipeDeck } from './components/SwipeDeck'
import { MatchModal } from './components/MatchModal'
import { FilterModal } from './components/FilterModal'
import { NewsFeed } from './components/NewsFeed'
import { UserProfile } from './components/UserProfile'
import { OnboardingFlow } from './components/OnboardingFlow'
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
import {
  loadTasteProfile,
  updateTasteWithSwipe,
  getTopGenreIds,
  type TasteProfile,
} from './services/tasteProfile'
import type { Movie, Room, SwipeAction } from './types'

export function App() {
  const userId = useRef(getOrCreateUserId()).current
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>(() => loadTasteProfile(userId))

  const [activeTab, setActiveTab] = useState<NavTab>('match')
  const [room, setRoom] = useState<Room | null>(null)
  const [selectedGenre, setSelectedGenre] = useState(0)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null)
  const [isMatchOpen, setIsMatchOpen] = useState(false)

  // Load movies from TMDb (with optional append for infinite solo mode)
  const loadMovies = useCallback(
    async (pageNum: number, genreId: number, append = false, limit = 20) => {
      setIsLoading(true)
      try {
        // If genreId is 0 and we are in room or personalized mode, consider user's top genre
        let effectiveGenre = genreId
        if (effectiveGenre === 0 && room) {
          const topUserGenres = getTopGenreIds(tasteProfile, 1)
          if (topUserGenres.length > 0) {
            effectiveGenre = topUserGenres[0]
          }
        }

        const fetched = await fetchPopularMovies(pageNum, effectiveGenre)

        // Enrich the top 6 movies with streaming providers immediately
        const sliceCount = limit
        const enriched = await Promise.all(
          fetched.slice(0, sliceCount).map(async (m, idx) => {
            if (idx < 6) {
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
    [room, tasteProfile]
  )

  // Initialize movies on mount or when genre / room changes
  useEffect(() => {
    if (tasteProfile.isOnboarded) {
      const limit = room ? 25 : 20
      loadMovies(1, selectedGenre, false, limit)
    }
  }, [tasteProfile.isOnboarded, room, selectedGenre, loadMovies])

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
    setRoundNumber(1)
    // Curate 25 movies specifically for this room
    loadMovies(1, selectedGenre, false, 25)
  }

  const handleLeaveRoom = () => {
    setRoom(null)
    setRoundNumber(1)
    window.history.replaceState({}, '', window.location.pathname)
    // Revert to infinite solo discovery mode
    loadMovies(1, selectedGenre, false, 20)
  }

  const handleSwipe = async (movie: Movie, action: SwipeAction) => {
    // Dynamically learn from swipe and update taste profile
    const updated = updateTasteWithSwipe(tasteProfile, movie, action)
    setTasteProfile(updated)

    // If active in a room, record to Supabase
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
    if (room) {
      // In room mode: load next 25-film round
      setRoundNumber((prev) => prev + 1)
      loadMovies(nextPage, selectedGenre, false, 25)
    } else {
      // In solo mode: append more movies seamlessly (infinite feed)
      loadMovies(nextPage, selectedGenre, true, 20)
    }
  }

  const handleGenreChange = (genreId: number) => {
    setSelectedGenre(genreId)
    setRoundNumber(1)
    const limit = room ? 25 : 20
    loadMovies(1, genreId, false, limit)
  }

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Onboarding Flow (shown on first launch or when test is reset) */}
      {!tasteProfile.isOnboarded && (
        <OnboardingFlow
          initialProfile={tasteProfile}
          onComplete={(completedProfile) => {
            setTasteProfile(completedProfile)
            loadMovies(1, selectedGenre, false, 20)
          }}
        />
      )}

      {/* App Header */}
      <Header
        roomCode={room ? room.room_code : null}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
        onOpenFilter={activeTab === 'match' ? () => setIsFilterOpen(true) : undefined}
        selectedGenreName={GENRES.find((g) => g.id === selectedGenre)?.name}
      />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'news' && <NewsFeed />}

        {activeTab === 'match' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Swipe Deck with infinite solo mode or 25-film room limit */}
            <SwipeDeck
              movies={movies}
              onSwipe={handleSwipe}
              onLoadNextRound={handleLoadNextRound}
              onResetGenre={() => handleGenreChange(0)}
              isLoading={isLoading}
              roundNumber={roundNumber}
              roundLimit={25}
              hasRoundLimit={!!room}
              isRoomMode={!!room}
              totalSwipesCount={tasteProfile.totalSwipes}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <UserProfile
            tasteProfile={tasteProfile}
            activeRoom={room}
            onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
            onLeaveRoom={handleLeaveRoom}
            onNavigateToMatch={() => setActiveTab('match')}
            onRetakeColdStart={() => setTasteProfile((prev) => ({ ...prev, isOnboarded: false }))}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasActiveRoom={!!room}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedGenre={selectedGenre}
        onSelectGenre={handleGenreChange}
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
