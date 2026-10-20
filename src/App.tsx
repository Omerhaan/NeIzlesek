import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { SwipeDeck } from './components/SwipeDeck'
import { MatchModal } from './components/MatchModal'
import { FilterModal } from './components/FilterModal'
import { NewsFeed } from './components/NewsFeed'
import { UserProfile } from './components/UserProfile'
import { OnboardingFlow } from './components/OnboardingFlow'
import { FallbackModal } from './components/FallbackModal'
import { MovieDetailModal } from './components/MovieDetailModal'
import { BottomNav, type NavTab } from './components/BottomNav'
import {
  getOrCreateUserId,
  recordSwipe,
  subscribeToRoom,
  getRoomByCode,
  setRoomDeck,
  advanceRoomRound,
  fetchRoomSwipesCount,
} from './services/supabase'
import {
  fetchFilteredMovies,
  fetchPopularMovies,
  fetchMovieDetails,
  fetchMovieProviders,
  GENRES,
  type FilterState,
  DEFAULT_FILTERS,
} from './services/tmdb'
import {
  loadTasteProfile,
  updateTasteWithSwipe,
  getTopGenreIds,
  type TasteProfile,
} from './services/tasteProfile'
import type { Movie, Room, SwipeAction } from './types'

const ROOM_DECK_SIZE = 25

async function fetchRoomDeck(startPage: number, filters: FilterState): Promise<{ movies: Movie[]; nextPage: number }> {
  const movies: Movie[] = []
  const seenIds = new Set<number>()
  let page = startPage
  let pagesScanned = 0

  // 1. Scan up to 6 TMDb pages to gather 25 unique movies matching user's filters
  while (movies.length < ROOM_DECK_SIZE && pagesScanned < 6) {
    const batch = await fetchFilteredMovies(page, filters)
    if (batch.length === 0) break
    for (const movie of batch) {
      if (seenIds.has(movie.id)) continue
      seenIds.add(movie.id)
      movies.push(movie)
      if (movies.length >= ROOM_DECK_SIZE) break
    }
    page += 1
    pagesScanned += 1
  }

  // 2. Fallback: If strict filters yielded fewer than 25 movies, guarantee deck size with top popular movies
  if (movies.length < ROOM_DECK_SIZE) {
    let fallbackPage = 1
    while (movies.length < ROOM_DECK_SIZE && fallbackPage <= 3) {
      const fallbackBatch = await fetchPopularMovies(fallbackPage, filters.genreId)
      if (!fallbackBatch || fallbackBatch.length === 0) break
      for (const movie of fallbackBatch) {
        if (seenIds.has(movie.id)) continue
        seenIds.add(movie.id)
        movies.push(movie)
        if (movies.length >= ROOM_DECK_SIZE) break
      }
      fallbackPage += 1
    }
  }

  return { movies, nextPage: page }
}

export function App() {
  const userId = useRef(getOrCreateUserId()).current
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>(() => loadTasteProfile(userId))

  const [activeTab, setActiveTab] = useState<NavTab>('match')
  const [room, setRoom] = useState<Room | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [movies, setMovies] = useState<Movie[]>([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null)
  const [isMatchOpen, setIsMatchOpen] = useState(false)
  const [cardDetailMovie, setCardDetailMovie] = useState<Movie | null>(null)
  const [isFallbackOpen, setIsFallbackOpen] = useState(false)
  const [partnerVetoNotice, setPartnerVetoNotice] = useState<string | null>(null)
  const [partnerSwipesCount, setPartnerSwipesCount] = useState(0)
  const [initialSwipeIndex, setInitialSwipeIndex] = useState(0)
  const roundNumberRef = useRef(roundNumber)
  roundNumberRef.current = roundNumber

  const tasteProfileRef = useRef(tasteProfile)
  tasteProfileRef.current = tasteProfile

  const moviesRef = useRef(movies)
  moviesRef.current = movies

  // Load movies from TMDb with duplicate & already swiped movie exclusion
  const loadMovies = useCallback(
    async (pageNum: number, currentFilters: FilterState, append = false, limit = 20) => {
      setIsLoading(true)
      try {
        const currentProfile = tasteProfileRef.current

        // If genreId is 0 and we are in room mode, consider user's top genre
        const effectiveFilters: FilterState = { ...currentFilters }
        if (effectiveFilters.genreId === 0 && room) {
          const topUserGenres = getTopGenreIds(currentProfile, 1)
          if (topUserGenres.length > 0) {
            effectiveFilters.genreId = topUserGenres[0]
          }
        }

        // Strictly exclude movies already liked or watched by the user
        const mustExcludeIds = new Set<number>([
          ...(currentProfile.likedMovies || []).map((m) => m.id),
          ...(currentProfile.watchedMovieIds || []),
          ...(currentProfile.watchedMovies || []).map((w) => w.movie.id),
        ])

        // Also exclude passed movies so user sees un-swiped content
        const passedIds = new Set<number>(currentProfile.passedMovieIds || [])

        // If appending to existing deck, also exclude movies already present in deck
        if (append && moviesRef.current) {
          for (const m of moviesRef.current) {
            mustExcludeIds.add(m.id)
          }
        }

        let currentPage = pageNum
        const accumulated: Movie[] = []
        let maxPagesToScan = 8 // Scan up to 8 TMDb pages if needed to find un-swiped movies

        while (accumulated.length < limit && maxPagesToScan > 0) {
          const fetched = await fetchFilteredMovies(currentPage, effectiveFilters)
          if (!fetched || fetched.length === 0) break

          for (const movie of fetched) {
            // Strictly exclude liked/watched, and prefer un-passed
            if (!mustExcludeIds.has(movie.id) && !passedIds.has(movie.id)) {
              mustExcludeIds.add(movie.id)
              accumulated.push(movie)
              if (accumulated.length >= limit) break
            }
          }

          currentPage++
          maxPagesToScan--
        }

        // Fallback: if not enough fresh movies, allow passed movies (but NEVER liked or watched)
        if (accumulated.length < limit) {
          let fallbackPage = 1
          let fallbackMax = 4
          while (accumulated.length < limit && fallbackMax > 0) {
            const fetched = await fetchFilteredMovies(fallbackPage, effectiveFilters)
            if (!fetched || fetched.length === 0) break
            for (const movie of fetched) {
              if (!mustExcludeIds.has(movie.id)) {
                mustExcludeIds.add(movie.id)
                accumulated.push(movie)
                if (accumulated.length >= limit) break
              }
            }
            fallbackPage++
            fallbackMax--
          }
        }

        // Enrich the top 6 movies with streaming providers immediately
        const enriched = await Promise.all(
          accumulated.map(async (m, idx) => {
            if (idx < 6) {
              const providers = await fetchMovieProviders(m.id)
              return { ...m, providers }
            }
            return m
          })
        )

        setMovies((prev) => (append ? [...prev, ...enriched] : enriched))
        setPage(currentPage)
      } catch (err) {
        console.error('Failed to load movies:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [room]
  )

  // Initialize movies on mount or when filters / room change
  useEffect(() => {
    if (tasteProfile.isOnboarded && !room) {
      loadMovies(1, filters, false, 20)
    }
  }, [tasteProfile.isOnboarded, room, filters, loadMovies])

  // Check URL query parameters or sessionStorage for active room on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const activeCode = params.get('room') || sessionStorage.getItem('neizlesek_active_room_code')
    if (activeCode) {
      getRoomByCode(activeCode).then((foundRoom) => {
        if (foundRoom) {
          handleRoomCreatedOrJoined(foundRoom)
          setActiveTab('match')
        } else {
          sessionStorage.removeItem('neizlesek_active_room_code')
        }
      })
    }
  }, [])

  // Listen to Supabase Realtime when an active room is set (Matches, Vetoes, Swipes)
  useEffect(() => {
    if (!room) return

    // Fetch initial partner swipe count and current user's progress
    fetchRoomSwipesCount(room.id, userId, roundNumber).then(({ myCount, partnerCount }) => {
      setPartnerSwipesCount(partnerCount)
      if (myCount > 0) {
        setInitialSwipeIndex(myCount)
      }
    })

    const unsubscribe = subscribeToRoom(
      room.id,
      roundNumber,
      userId,
      async (matchedMovieId) => {
        const details = await fetchMovieDetails(matchedMovieId)
        if (details) {
          setMatchedMovie(details)
          setIsMatchOpen(true)
          setIsFallbackOpen(false)
        }
      },
      (vetoedMovieId, vetoUserId) => {
        if (vetoUserId !== userId) {
          // Partner vetoed a movie: remove it from current deck immediately
          setMovies((prev) => prev.filter((m) => m.id !== vetoedMovieId))
          setPartnerVetoNotice('Partnerin bir filmi veto etti! 🚫')
          setTimeout(() => setPartnerVetoNotice(null), 3000)
        }
      },
      (partnerCountOrInc) => {
        // Partner swiped on a movie: update partner count live (handles both delta and absolute sync)
        if (typeof partnerCountOrInc === 'number' && partnerCountOrInc > 1) {
          setPartnerSwipesCount(partnerCountOrInc)
        } else {
          setPartnerSwipesCount((prev) => prev + 1)
        }
      },
      async (incomingRound, deckIds) => {
        if (incomingRound <= roundNumberRef.current) return
        roundNumberRef.current = incomingRound
        setRoundNumber(incomingRound)
        setPartnerSwipesCount(0)
        setInitialSwipeIndex(0)
        setRoom({ ...room, round_number: incomingRound, room_deck: deckIds })
        setIsLoading(true)
        try {
          const details = await Promise.all(deckIds.map((id) => fetchMovieDetails(id)))
          if (roundNumberRef.current === incomingRound) {
            setMovies(details.filter((movie): movie is Movie => movie !== null))
          }
        } finally {
          if (roundNumberRef.current === incomingRound) setIsLoading(false)
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [room, userId, roundNumber])

  const handleRoomCreatedOrJoined = async (newRoom: Room) => {
    setRoom(newRoom)
    sessionStorage.setItem('neizlesek_active_room_code', newRoom.room_code)
    const newUrl = `${window.location.pathname}?room=${newRoom.room_code}`
    window.history.replaceState({}, '', newUrl)

    const initialRound = newRoom.round_number ?? 1
    roundNumberRef.current = initialRound
    setRoundNumber(initialRound)

    // Check existing progress in this room round
    fetchRoomSwipesCount(newRoom.id, userId, initialRound).then(({ myCount, partnerCount }) => {
      setInitialSwipeIndex(myCount)
      setPartnerSwipesCount(partnerCount)
    })

    if (newRoom.room_deck && newRoom.room_deck.length > 0) {
      // Partner joined: load identical 25 movies saved in room_deck
      setIsLoading(true)
      try {
        const details = await Promise.all(
          newRoom.room_deck.map((id) => fetchMovieDetails(id))
        )
        const valid = details.filter((m): m is Movie => m !== null)
        setMovies(valid)
      } catch (err) {
        console.error('Error loading room deck:', err)
      } finally {
        setIsLoading(false)
      }
    } else {
      // Creator created room: curate 25 movies and persist to room_deck in Supabase
      setIsLoading(true)
      try {
        const { movies: deck25, nextPage } = await fetchRoomDeck(1, filters)
        const movieIds = deck25.map((m) => m.id)
        setPage(nextPage)
        const canonicalIds = await setRoomDeck(newRoom.id, movieIds)
        const fetchedById = new Map(deck25.map((movie) => [movie.id, movie]))
        const canonicalMovies = await Promise.all(
          canonicalIds.map((id) => fetchedById.get(id) ?? fetchMovieDetails(id))
        )
        const validMovies = canonicalMovies.filter((movie): movie is Movie => movie !== null)
        setMovies(validMovies)
        setRoom({ ...newRoom, room_deck: canonicalIds })
      } catch (err) {
        console.error('Error creating room deck:', err)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('neizlesek_active_room_code')
    setRoom(null)
    setRoundNumber(1)
    setPartnerSwipesCount(0)
    setInitialSwipeIndex(0)
    window.history.replaceState({}, '', window.location.pathname)
    // Revert to infinite solo discovery mode
    loadMovies(1, filters, false, 20)
  }

  const handleSwipe = async (movie: Movie, action: SwipeAction) => {
    // Dynamically learn from swipe and update taste profile
    const updated = updateTasteWithSwipe(tasteProfile, movie, action)
    setTasteProfile(updated)

    // If active in a room, record to Supabase
    if (room) {
      try {
        await recordSwipe(room.id, userId, movie.id, action, roundNumber)
      } catch (err) {
        console.error('Swipe record error:', err)
      }
    }
  }

  const handleLoadNextRound = async () => {
    const nextPage = page + 1
    if (room) {
      // In room mode: curate next 25-film round and sync room_deck
      setIsLoading(true)
      try {
        const { movies: deck25, nextPage: followingPage } = await fetchRoomDeck(nextPage, filters)
        const movieIds = deck25.map((m) => m.id)
        const updatedRoom = await advanceRoomRound(room.id, roundNumber, movieIds)
        setPage(followingPage)
        if (updatedRoom.round_number > roundNumberRef.current) {
          roundNumberRef.current = updatedRoom.round_number
          setRoundNumber(updatedRoom.round_number)
          setPartnerSwipesCount(0)
          setRoom({ ...room, round_number: updatedRoom.round_number, room_deck: updatedRoom.room_deck })
          const details = await Promise.all(updatedRoom.room_deck.map((id) => fetchMovieDetails(id)))
          setMovies(details.filter((movie): movie is Movie => movie !== null))
        }
      } catch (err) {
        console.error('Error loading next room round:', err)
      } finally {
        setIsLoading(false)
      }
    } else {
      // In solo mode: append more movies seamlessly (infinite feed)
      loadMovies(nextPage, filters, true, 20)
    }
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
    setRoundNumber(1)
    const limit = room ? 25 : 20
    loadMovies(1, newFilters, false, limit)
  }

  // Calculate active filter count for badge
  const activeFilterCount =
    (filters.genreId > 0 ? 1 : 0) +
    filters.platformIds.length +
    (filters.yearRange !== 'all' ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0)

  const genreName = GENRES.find((g) => g.id === filters.genreId)?.name
  const headerFilterLabel = filters.genreId > 0 ? genreName : activeFilterCount > 0 ? `Filtreli (${activeFilterCount})` : 'Filtrele'

  return (
    <div className="relative w-full h-[100dvh] flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Onboarding Flow (shown on first launch or when test is reset) */}
      {!tasteProfile.isOnboarded && (
        <OnboardingFlow
          initialProfile={tasteProfile}
          onComplete={(completedProfile) => {
            setTasteProfile(completedProfile)
            loadMovies(1, filters, false, 20)
          }}
        />
      )}

      {/* App Header */}
      <Header
        roomCode={room ? room.room_code : null}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
        onOpenFilter={activeTab === 'match' ? () => setIsFilterOpen(true) : undefined}
        selectedGenreName={headerFilterLabel}
        activeFilterCount={activeFilterCount}
      />

      {/* Partner Veto Toast Notification */}
      {partnerVetoNotice && (
        <div className="absolute top-16 inset-x-4 z-40 bg-red-950/90 border border-red-500/50 text-red-200 py-2.5 px-4 rounded-2xl text-xs font-bold text-center shadow-xl shadow-red-950/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 flex items-center justify-center gap-2">
          <span>🚫</span>
          <span>{partnerVetoNotice}</span>
        </div>
      )}

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'news' && <NewsFeed />}

        {activeTab === 'match' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Swipe Deck with infinite solo mode or 25-film room limit */}
            <SwipeDeck
              key={`${roundNumber}_${filters.genreId}_${filters.platformIds.join(',')}_${filters.yearRange}_${filters.minRating}_${room?.id || 'solo'}`}
              movies={movies}
              onSwipe={handleSwipe}
              onLoadNextRound={handleLoadNextRound}
              onResetGenre={() => handleApplyFilters(DEFAULT_FILTERS)}
              isLoading={isLoading}
              roundNumber={roundNumber}
              roundLimit={25}
              hasRoundLimit={!!room}
              isRoomMode={!!room}
              totalSwipesCount={tasteProfile.totalSwipes}
              onOpenDetails={setCardDetailMovie}
              onOpenFallback={room ? () => setIsFallbackOpen(true) : undefined}
              partnerSwipesCount={partnerSwipesCount}
              initialIndex={initialSwipeIndex}
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
            onUpdateTasteProfile={setTasteProfile}
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
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Movie Card Preview & Trailer Modal */}
      <MovieDetailModal
        movie={cardDetailMovie}
        listType="preview"
        isOpen={!!cardDetailMovie}
        onClose={() => setCardDetailMovie(null)}
        onSwipeFromModal={handleSwipe}
        canVeto={!!room}
      />

      {/* Fallback Voting Modal (When no match after round) */}
      {room && (
        <FallbackModal
          roomId={room.id}
          roundNumber={roundNumber}
          isOpen={isFallbackOpen}
          onClose={() => setIsFallbackOpen(false)}
          onSelectMovie={(movie) => {
            setMatchedMovie(movie)
            setIsMatchOpen(true)
            setIsFallbackOpen(false)
          }}
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
