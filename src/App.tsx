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
  createRoom,
  recordSwipe,
  subscribeToRoom,
  getRoomByCode,
  getRoomUserDeck,
  saveRoomUserDeck,
  saveRoomParticipantTaste,
  fetchRoomUsedMovieIds,
  advanceRoomRound,
  fetchRoomSwipesCount,
  fetchRoomVetoedMovieIds,
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

function roomMoviePlaceholder(id: number): Movie {
  return {
    id,
    title: `Film #${id}`,
    original_title: `Film #${id}`,
    overview: 'Film detayları şu anda yüklenemedi.',
    poster_path: null,
    backdrop_path: null,
    vote_average: 7.5,
    release_date: '',
    genre_ids: [],
  }
}

async function fetchRoomMovies(movieIds: number[]): Promise<Movie[]> {
  const movies = new Array<Movie>(movieIds.length)
  let nextIndex = 0
  const worker = async () => {
    while (nextIndex < movieIds.length) {
      const index = nextIndex
      nextIndex += 1
      const id = movieIds[index]
      let movie: Movie | null = null
      for (let attempt = 0; attempt < 2 && !movie; attempt += 1) {
        movie = await fetchMovieDetails(id, false)
      }
      movies[index] = movie ?? roomMoviePlaceholder(id)
    }
  }

  await Promise.all(Array.from({ length: Math.min(4, movieIds.length) }, () => worker()))
  return movies
}

async function fetchPersonalRoomDeck(
  profile: TasteProfile,
  filters: FilterState,
  excludedIds: number[]
): Promise<Movie[]> {
  const excluded = new Set([...excludedIds, ...(profile.watchedMovieIds ?? []), ...(profile.watchedMovies ?? []).map((w) => w.movie.id)])
  const candidates = new Map<number, Movie>()
  const preferredGenres = filters.genreId > 0 ? [filters.genreId] : getTopGenreIds(profile, 4)
  const genreQueries = preferredGenres.length ? preferredGenres : [0]

  for (const genreId of genreQueries) {
    for (let page = 1; page <= 3 && candidates.size < ROOM_DECK_SIZE * 3; page += 1) {
      const batch = await fetchFilteredMovies(page, { ...filters, genreId })
      for (const movie of batch) if (!excluded.has(movie.id)) candidates.set(movie.id, movie)
      if (batch.length === 0) break
    }
  }
  for (let page = 1; page <= 5 && candidates.size < ROOM_DECK_SIZE * 2; page += 1) {
    const batch = await fetchPopularMovies(page, filters.genreId)
    for (const movie of batch) if (!excluded.has(movie.id)) candidates.set(movie.id, movie)
    if (batch.length === 0) break
  }

  const score = (movie: Movie) => {
    const taste = movie.genre_ids.reduce((sum, id) => sum + Math.max(0, profile.genreScores[id] ?? 0), 0)
    return taste * 2 + movie.vote_average * 0.1 + Math.log1p(candidates.size)
  }
  return Array.from(candidates.values()).sort((a, b) => score(b) - score(a)).slice(0, ROOM_DECK_SIZE)
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
  const [roomSyncError, setRoomSyncError] = useState<string | null>(null)
  const [vetoedMovieIds, setVetoedMovieIds] = useState<Set<number>>(() => new Set())
  const [partnerSwipesCount, setPartnerSwipesCount] = useState(0)
  const [initialSwipeIndex, setInitialSwipeIndex] = useState(0)
  const roundNumberRef = useRef(roundNumber)
  roundNumberRef.current = roundNumber

  const tasteProfileRef = useRef(tasteProfile)
  tasteProfileRef.current = tasteProfile

  const moviesRef = useRef(movies)
  moviesRef.current = movies

  const ensurePersonalRoomDeck = useCallback(async (roomId: string, targetRound: number) => {
    const existingIds = await getRoomUserDeck(roomId, userId, targetRound)
    if (existingIds?.length === ROOM_DECK_SIZE) return fetchRoomMovies(existingIds)
    const profile = tasteProfileRef.current
    await saveRoomParticipantTaste(roomId, userId, profile.genreScores, Array.from(new Set([
      ...(profile.watchedMovieIds ?? []), ...(profile.watchedMovies ?? []).map((entry) => entry.movie.id),
    ])))
    const previouslySeen = await fetchRoomUsedMovieIds(roomId, userId)
    const deck = await fetchPersonalRoomDeck(profile, filters, previouslySeen)
    if (deck.length !== ROOM_DECK_SIZE) throw new Error(`Kişisel desten için ${ROOM_DECK_SIZE} izlenmemiş film bulunamadı; şu an ${deck.length} aday var.`)
    const canonicalIds = await saveRoomUserDeck(roomId, userId, targetRound, deck.map((movie) => movie.id))
    const byId = new Map(deck.map((movie) => [movie.id, movie]))
    const missing = await fetchRoomMovies(canonicalIds.filter((id) => !byId.has(id)))
    const missingById = new Map(missing.map((movie) => [movie.id, movie]))
    return canonicalIds.map((id) => byId.get(id) ?? missingById.get(id) ?? roomMoviePlaceholder(id))
  }, [filters, userId])

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
    let isCurrentSubscription = true

    // Fetch initial partner swipe count and current user's progress
    fetchRoomSwipesCount(room.id, userId, roundNumber).then(({ myCount, partnerCount }) => {
      if (!isCurrentSubscription || roundNumberRef.current !== roundNumber) return
      setPartnerSwipesCount(partnerCount)
      if (myCount > 0) {
        setInitialSwipeIndex(myCount)
      }
    }).catch((error) => {
      if (isCurrentSubscription && roundNumberRef.current === roundNumber) {
        setRoomSyncError('Oda ilerlemesi alınamadı. Bağlantı tekrar denenecek.')
        console.error('Failed to load initial room progress:', error)
      }
    })
    fetchRoomVetoedMovieIds(room.id, roundNumber)
      .then((ids) => {
        if (isCurrentSubscription && roundNumberRef.current === roundNumber) {
          setVetoedMovieIds(new Set(ids))
        }
      })
      .catch((error) => console.error('Failed to load round vetoes:', error))

    const unsubscribe = subscribeToRoom(
      room.id,
      roundNumber,
      userId,
      // A shared like can mark the room as matched before the deck is finished.
      // Keep that event quiet; the end-of-round modal presents shared likes and
      // taste-based recommendations after both users complete their cards.
      () => {},
      (vetoedMovieId, vetoUserId) => {
        if (roundNumberRef.current !== roundNumber) return
        if (vetoUserId !== userId) {
          // Keep the canonical 25-card deck intact. SwipeDeck records a neutral
          // pass when this slot reaches the front of the local deck.
          setVetoedMovieIds((prev) => new Set(prev).add(vetoedMovieId))
          setPartnerVetoNotice('Partnerin bir filmi veto etti! 🚫')
          setTimeout(() => setPartnerVetoNotice(null), 3000)
        }
      },
      (partnerCount) => {
        if (roundNumberRef.current !== roundNumber) return
        // Realtime and polling both provide the exact unique-film count.
        setPartnerSwipesCount((prev) => Math.max(prev, partnerCount))
      },
      async (incomingRound) => {
        if (incomingRound <= roundNumberRef.current) return
        roundNumberRef.current = incomingRound
        setRoundNumber(incomingRound)
        setPartnerSwipesCount(0)
        setInitialSwipeIndex(0)
        setVetoedMovieIds(new Set())
        setRoomSyncError(null)
        setRoom({ ...room, round_number: incomingRound })
        setIsLoading(true)
        try {
          const details = await ensurePersonalRoomDeck(room.id, incomingRound)
          if (roundNumberRef.current === incomingRound) {
            setMovies(details)
          }
        } finally {
          if (roundNumberRef.current === incomingRound) setIsLoading(false)
        }
      }
    )

    return () => {
      isCurrentSubscription = false
      unsubscribe()
    }
  }, [room?.id, userId, roundNumber, ensurePersonalRoomDeck])

  // Create the room shell; each participant will prepare a separate personal deck.
  const handleCreateRoomAction = async (): Promise<Room> => {
    return createRoom()
  }

  const handleRoomCreatedOrJoined = async (newRoom: Room) => {
    setRoom(newRoom)
    setInitialSwipeIndex(0)
    setVetoedMovieIds(new Set())
    setRoomSyncError(null)
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
    }).catch((error) => {
      setRoomSyncError('Oda ilerlemesi alınamadı. Bağlantıyı kontrol edip yeniden yükleyin.')
      console.error('Failed to load joined room progress:', error)
    })

    setIsLoading(true)
    try {
      setMovies(await ensurePersonalRoomDeck(newRoom.id, initialRound))
    } catch (err) {
      setRoomSyncError(err instanceof Error ? err.message : 'Kişisel film listen hazırlanamadı.')
      console.error('Error creating personal room deck:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('neizlesek_active_room_code')
    setRoom(null)
    setVetoedMovieIds(new Set())
    setRoomSyncError(null)
    setRoundNumber(1)
    setPartnerSwipesCount(0)
    setInitialSwipeIndex(0)
    window.history.replaceState({}, '', window.location.pathname)
    // Revert to infinite solo discovery mode
    loadMovies(1, filters, false, 20)
  }

  const handleSwipe = async (movie: Movie, action: SwipeAction): Promise<boolean> => {
    // If active in a room, record to Supabase
    if (room) {
      try {
        await recordSwipe(room.id, userId, movie.id, action, roundNumber)
        setRoomSyncError(null)
      } catch (err) {
        console.error('Swipe record error:', err)
        setRoomSyncError('Seçimin kaydedilemedi. Kartı tekrar kaydırmayı dene; ilerlemen kaybolmadı.')
        return false
      }
    }

    // Learn only after the room accepted the swipe, so retries do not double-count taste.
    const updated = updateTasteWithSwipe(tasteProfile, movie, action)
    setTasteProfile(updated)
    return true
  }

  const handleLoadNextRound = async () => {
    const nextPage = page + 1
    if (room) {
      // In room mode: curate next 25-film round and sync room_deck
      setIsLoading(true)
      try {
        const personalDeck = await ensurePersonalRoomDeck(room.id, roundNumber + 1)
        const updatedRoom = await advanceRoomRound(room.id, roundNumber, personalDeck.map((movie) => movie.id))
        setPage(nextPage)
        if (updatedRoom.round_number > roundNumberRef.current) {
          roundNumberRef.current = updatedRoom.round_number
          setRoundNumber(updatedRoom.round_number)
          setPartnerSwipesCount(0)
          setInitialSwipeIndex(0)
          setVetoedMovieIds(new Set())
          setRoomSyncError(null)
          setRoom({ ...room, round_number: updatedRoom.round_number })
          setMovies(personalDeck)
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
      {roomSyncError && (
        <div role="alert" className="absolute top-28 inset-x-4 z-40 bg-amber-950/95 border border-amber-500/50 text-amber-100 py-2.5 px-4 rounded-2xl text-xs font-bold text-center shadow-xl backdrop-blur-md">
          {roomSyncError}
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
              vetoedMovieIds={vetoedMovieIds}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <UserProfile
            tasteProfile={tasteProfile}
            activeRoom={room}
            onCreateRoom={handleCreateRoomAction}
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
          onNextRound={handleLoadNextRound}
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
