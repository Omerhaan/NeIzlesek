import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { Header } from './components/Header'
import { SwipeDeck } from './components/SwipeDeck'
import { BottomNav, type NavTab } from './components/BottomNav'
import { PWAInstallBanner } from './components/PWAInstallBanner'
import { QuickRatingPrompt } from './components/QuickRatingPrompt'
import { hapticLike } from './utils/haptics'

const MatchModal = lazy(() => import('./components/MatchModal').then((m) => ({ default: m.MatchModal })))
const FilterModal = lazy(() => import('./components/FilterModal').then((m) => ({ default: m.FilterModal })))
const NewsFeed = lazy(() => import('./components/NewsFeed').then((m) => ({ default: m.NewsFeed })))
const UserProfile = lazy(() => import('./components/UserProfile').then((m) => ({ default: m.UserProfile })))
const OnboardingFlow = lazy(() => import('./components/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow })))
const FallbackModal = lazy(() => import('./components/FallbackModal').then((m) => ({ default: m.FallbackModal })))
const MovieDetailModal = lazy(() => import('./components/MovieDetailModal').then((m) => ({ default: m.MovieDetailModal })))
const RoomWaitingLobby = lazy(() => import('./components/RoomWaitingLobby').then((m) => ({ default: m.RoomWaitingLobby })))
const GroupResultModal = lazy(() => import('./components/GroupResultModal').then((m) => ({ default: m.GroupResultModal })))
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })))
const GlobalSearchModal = lazy(() => import('./components/GlobalSearchModal').then((m) => ({ default: m.GlobalSearchModal })))
const MovieRouletteModal = lazy(() => import('./components/MovieRouletteModal').then((m) => ({ default: m.MovieRouletteModal })))
import {
  getOrCreateUserId,
  createRoom,
  joinRoom,
  recordSwipe,
  subscribeToRoom,
  getRoomByCode,
  getRoomUserDeck,
  saveRoomUserDeck,
  saveRoomParticipantTaste,
  fetchRoomUsedMovieIds,
  getLegacyRoomDeck,
  advanceRoomRound,
  fetchRoomSwipesCount,
  fetchRoomVetoedMovieIds,
  fetchPartnerGenreScores,
  getCurrentAuthUser,
  signOutUser,
  syncProfileToCloud,
  activateRoom,
  updateParticipantPresence,
  deleteRoomSwipe,
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
  saveTasteProfile,
  updateTasteWithSwipe,
  getTopGenreIds,
  addMatchedMovie,
  updateMovieRating,
  markMovieAsWatched,
  type TasteProfile,
} from './services/tasteProfile'
import type { Movie, Room, SwipeAction, GroupParticipant, GroupVoteResult, RoomMode } from './types'
import { calculateGroupVotingResults } from './services/groupVoting'

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
    const batch = await fetchFilteredMovies(page, { ...filters, genreId: filters.genreId })
    for (const movie of batch) if (!excluded.has(movie.id)) candidates.set(movie.id, movie)
    if (batch.length === 0) break
  }

  // Ensure minimum candidates count with popular movies fallback
  if (candidates.size < ROOM_DECK_SIZE) {
    for (let page = 1; page <= 5 && candidates.size < ROOM_DECK_SIZE; page += 1) {
      const batch = await fetchPopularMovies(page, filters.genreId)
      for (const movie of batch) if (!excluded.has(movie.id)) candidates.set(movie.id, movie)
      if (batch.length === 0) break
    }
  }

  const score = (movie: Movie) => {
    const taste = movie.genre_ids.reduce((sum, id) => sum + Math.max(0, profile.genreScores[id] ?? 0), 0)
    return taste * 2 + movie.vote_average * 0.1
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
  const [partnerJoinedNotice, setPartnerJoinedNotice] = useState<string | null>(null)
  const [isWaitingBypassed, setIsWaitingBypassed] = useState(false)
  const [roomSyncError, setRoomSyncError] = useState<string | null>(null)
  const [vetoedMovieIds, setVetoedMovieIds] = useState<Set<number>>(() => new Set())
  const [partnerSwipesCount, setPartnerSwipesCount] = useState(0)
  const [initialSwipeIndex, setInitialSwipeIndex] = useState(0)
  const [partnerScores, setPartnerScores] = useState<Record<number, number> | undefined>(undefined)
  const [authUser, setAuthUser] = useState<any>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false)
  const [groupParticipants, setGroupParticipants] = useState<GroupParticipant[]>([])
  const [groupResults, setGroupResults] = useState<GroupVoteResult[] | null>(null)
  const [isGroupResultsOpen, setIsGroupResultsOpen] = useState(false)
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [isRouletteModalOpen, setIsRouletteModalOpen] = useState(false)
  const [recentlyWatchedMovie, setRecentlyWatchedMovie] = useState<Movie | null>(null)
  const roundNumberRef = useRef(roundNumber)
  roundNumberRef.current = roundNumber

  const roomRef = useRef<Room | null>(room)
  roomRef.current = room

  const hasRoomContext = useCallback(() => {
    return Boolean(
      roomRef.current ||
      new URLSearchParams(window.location.search).has('room') ||
      sessionStorage.getItem('neizlesek_active_room_code')
    )
  }, [])

  const tasteProfileRef = useRef(tasteProfile)
  tasteProfileRef.current = tasteProfile

  const moviesRef = useRef(movies)
  moviesRef.current = movies

  const swipeHistoryRef = useRef<Array<{ movie: Movie; action: SwipeAction; previousProfile: TasteProfile }>>([])

  // Check Supabase Auth user on mount
  useEffect(() => {
    getCurrentAuthUser().then((user) => {
      if (user) {
        setAuthUser(user)
        const cloudProfile = user.user_metadata?.taste_profile as TasteProfile | undefined
        if (cloudProfile && cloudProfile.totalSwipes > tasteProfileRef.current.totalSwipes) {
          setTasteProfile(cloudProfile)
          saveTasteProfile(cloudProfile)
        }
      }
    })
  }, [])

  const handleAuthSuccess = (user: any, restoredProfile?: TasteProfile) => {
    setAuthUser(user)
    if (restoredProfile) {
      setTasteProfile(restoredProfile)
      saveTasteProfile(restoredProfile)
    } else {
      void syncProfileToCloud(tasteProfileRef.current)
    }
  }

  const handleSignOut = async () => {
    await signOutUser()
    setAuthUser(null)
  }

  // Auto-dismiss roomSyncError after 5 seconds
  useEffect(() => {
    if (!roomSyncError) return
    const timer = setTimeout(() => setRoomSyncError(null), 5000)
    return () => clearTimeout(timer)
  }, [roomSyncError])

  const ensurePersonalRoomDeck = useCallback(async (roomId: string, targetRound: number) => {
    // 1. Check existing personal deck from room_user_decks (if table exists)
    const existingIds = await getRoomUserDeck(roomId, userId, targetRound).catch(() => null)
    if (existingIds && existingIds.length > 0) return fetchRoomMovies(existingIds)

    // 2. Check legacy room_deck on match_rooms
    const legacyDeck = await getLegacyRoomDeck(roomId, targetRound).catch(() => null)
    const progress = await fetchRoomSwipesCount(roomId, userId, targetRound).catch(() => ({ myCount: 0, partnerCount: 0 }))
    if (progress.myCount > 0 && legacyDeck && legacyDeck.length > 0) {
      return fetchRoomMovies(legacyDeck)
    }

    const profile = tasteProfileRef.current
    await saveRoomParticipantTaste(roomId, userId, profile.genreScores, Array.from(new Set([
      ...(profile.watchedMovieIds ?? []), ...(profile.watchedMovies ?? []).map((entry) => entry.movie.id),
    ]))).catch(() => {})

    // If partner already created a shared deck and room_user_decks is not enabled, adopt shared deck
    if (legacyDeck && legacyDeck.length >= 20) {
      return fetchRoomMovies(legacyDeck)
    }

    const previouslySeen = await fetchRoomUsedMovieIds(roomId, userId).catch(() => [])
    const deck = await fetchPersonalRoomDeck(profile, filters, previouslySeen)

    // Pad to 25 movies if needed
    const finalDeck = [...deck]
    if (finalDeck.length < ROOM_DECK_SIZE) {
      let padPage = 1
      const existingDeckIds = new Set(finalDeck.map((m) => m.id))
      while (finalDeck.length < ROOM_DECK_SIZE && padPage <= 5) {
        const padBatch = await fetchPopularMovies(padPage, filters.genreId)
        if (!padBatch || padBatch.length === 0) break
        for (const movie of padBatch) {
          if (!existingDeckIds.has(movie.id)) {
            existingDeckIds.add(movie.id)
            finalDeck.push(movie)
            if (finalDeck.length >= ROOM_DECK_SIZE) break
          }
        }
        padPage++
      }
    }

    const movieIds = finalDeck.slice(0, ROOM_DECK_SIZE).map((m) => m.id)
    const canonicalIds = await saveRoomUserDeck(roomId, userId, targetRound, movieIds).catch(() => movieIds)

    const byId = new Map(finalDeck.map((movie) => [movie.id, movie]))
    const missing = await fetchRoomMovies(canonicalIds.filter((id) => !byId.has(id)))
    const missingById = new Map(missing.map((movie) => [movie.id, movie]))
    return canonicalIds.map((id) => byId.get(id) ?? missingById.get(id) ?? roomMoviePlaceholder(id))
  }, [filters, userId])

  // Load movies from TMDb with duplicate & already swiped movie exclusion
  const loadMovies = useCallback(
    async (pageNum: number, currentFilters: FilterState, append = false, limit = 20) => {
      // Never fetch solo movies if an active room exists or room join is in progress
      if (hasRoomContext()) {
        return
      }

      setIsLoading(true)
      try {
        const currentProfile = tasteProfileRef.current

        // If genreId is 0 and we are in room mode, consider user's top genre
        const effectiveFilters: FilterState = { ...currentFilters }
        if (effectiveFilters.genreId === 0 && roomRef.current) {
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

        // Guard against race condition: room was connected while TMDb calls were in flight
        if (hasRoomContext()) {
          return
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
    [hasRoomContext]
  )

  // Initialize movies on mount or when filters / room change
  useEffect(() => {
    if (tasteProfile.isOnboarded && !hasRoomContext()) {
      loadMovies(1, filters, false, 20)
    }
  }, [tasteProfile.isOnboarded, filters, loadMovies, hasRoomContext])

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
          window.history.replaceState({}, '', window.location.pathname)
          if (tasteProfileRef.current.isOnboarded) {
            loadMovies(1, filters, false, 20)
          }
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

    const cachedScores = sessionStorage.getItem('neizlesek_partner_scores_' + room.id)
    if (cachedScores) {
      try {
        setPartnerScores(JSON.parse(cachedScores))
      } catch {}
    }

    fetchPartnerGenreScores(room.id, userId)
      .then((scores) => {
        if (isCurrentSubscription && scores) {
          setPartnerScores(scores)
          sessionStorage.setItem('neizlesek_partner_scores_' + room.id, JSON.stringify(scores))
        }
      })
      .catch(() => {})

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
          const vetoerName =
            groupParticipants.find((p) => p.userId === vetoUserId)?.username ||
            (room.room_mode === 'group' ? 'Grup üyesi' : 'Partnerin')
          setPartnerVetoNotice(`${vetoerName} bir filmi veto etti! 🚫`)
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
        setIsGroupResultsOpen(false)
        setIsLoading(true)
        try {
          const details = await ensurePersonalRoomDeck(room.id, incomingRound)
          if (roundNumberRef.current === incomingRound) {
            setMovies(details)
          }
        } finally {
          if (roundNumberRef.current === incomingRound) setIsLoading(false)
        }
      },
      (partnerName) => {
        if (!isCurrentSubscription) return
        setRoom((prev) => {
          if (!prev) return null
          hapticLike()
          setPartnerJoinedNotice(`${partnerName} odaya katıldı! 🎉`)
          setTimeout(() => setPartnerJoinedNotice(null), 4000)
          return {
            ...prev,
            status: prev.room_mode === 'group' ? prev.status : 'active',
            partner_name: partnerName,
          }
        })
      },
      Boolean(room.partner_name),
      (scores) => {
        if (!isCurrentSubscription) return
        setPartnerScores(scores)
        sessionStorage.setItem('neizlesek_partner_scores_' + room.id, JSON.stringify(scores))
      },
      tasteProfile.genreScores,
      {
        myParticipantInfo: {
          username: tasteProfile.username || 'Katılımcı',
          avatar: tasteProfile.avatar || '🍿',
        },
        onParticipantsChanged: (participants) => {
          if (!isCurrentSubscription) return
          setGroupParticipants(participants)
        },
        onRoomActivated: () => {
          if (!isCurrentSubscription) return
          setRoom((prev) => (prev ? { ...prev, status: 'active' } : null))
        },
      }
    )

    return () => {
      isCurrentSubscription = false
      unsubscribe()
    }
  }, [room?.id, userId, roundNumber, ensurePersonalRoomDeck, tasteProfile.username, tasteProfile.avatar, groupParticipants])

  // Create the room shell; supports pair or group watch party mode
  const handleCreateRoomAction = async (mode: RoomMode = 'pair'): Promise<Room> => {
    const newRoom = await createRoom(
      tasteProfile.username || 'Kurucu',
      undefined,
      mode,
      mode === 'group' ? 5 : 2
    )
    sessionStorage.setItem('neizlesek_created_room_code', newRoom.room_code)
    setIsWaitingBypassed(false)
    return newRoom
  }

  // Creator can manually activate group session when members are ready
  const handleStartGroupRoom = async () => {
    if (!room) return
    try {
      await activateRoom(room.id)
      setRoom((prev) => (prev ? { ...prev, status: 'active' } : null))
    } catch (err) {
      console.warn('Could not activate group room:', err)
    }
  }

  // Calculate and display group podium voting results
  const handleOpenGroupResults = async () => {
    if (!room) return
    try {
      setIsLoading(true)
      const results = await calculateGroupVotingResults(
        room.id,
        roundNumber,
        movies,
        Math.max(groupParticipants.length, 2)
      )
      setGroupResults(results)
      setIsGroupResultsOpen(true)
    } catch (err) {
      console.error('Failed to calculate group results:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoomCreatedOrJoined = async (newRoom: Room, isExplicitCreator?: boolean) => {
    const createdCode = sessionStorage.getItem('neizlesek_created_room_code')
    const isCreator = isExplicitCreator !== undefined ? isExplicitCreator : createdCode === newRoom.room_code

    let activeRoom = newRoom
    // If not creator and room is waiting for partner, join and activate it
    if (!isCreator && (newRoom.status === 'waiting' || !newRoom.partner_name)) {
      try {
        activeRoom = await joinRoom(newRoom.id, tasteProfile.username || (newRoom.room_mode === 'group' ? 'Misafir' : 'Partner'))
      } catch (err) {
        console.warn('Could not activate room on partner join:', err)
      }
    }

    setRoom(activeRoom)
    setInitialSwipeIndex(0)
    setVetoedMovieIds(new Set())
    setRoomSyncError(null)
    sessionStorage.setItem('neizlesek_active_room_code', activeRoom.room_code)
    const newUrl = `${window.location.pathname}?room=${activeRoom.room_code}`
    window.history.replaceState({}, '', newUrl)

    const initialRound = activeRoom.round_number ?? 1
    roundNumberRef.current = initialRound
    setRoundNumber(initialRound)

    // Check existing progress in this room round
    fetchRoomSwipesCount(activeRoom.id, userId, initialRound).then(({ myCount, partnerCount }) => {
      setInitialSwipeIndex(myCount)
      setPartnerSwipesCount(partnerCount)
    }).catch((error) => {
      console.warn('Failed to load joined room progress:', error)
    })

    setIsLoading(true)
    try {
      setMovies(await ensurePersonalRoomDeck(activeRoom.id, initialRound))
    } catch (err) {
      setRoomSyncError(err instanceof Error ? err.message : 'Kişisel film listen hazırlanamadı.')
      console.error('Error creating personal room deck:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('neizlesek_active_room_code')
    sessionStorage.removeItem('neizlesek_created_room_code')
    setIsWaitingBypassed(false)
    setPartnerJoinedNotice(null)
    setPartnerScores(undefined)
    setRoom(null)
    roomRef.current = null
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
        if (room.room_mode === 'group') {
          void updateParticipantPresence(
            room.id,
            userId,
            tasteProfile.username || 'Katılımcı',
            tasteProfile.avatar || '🍿',
            initialSwipeIndex + 1
          )
        }
      } catch (err) {
        console.error('Swipe record error:', err)
        setRoomSyncError('Seçimin kaydedilemedi. Kartı tekrar kaydırmayı dene; ilerlemen kaybolmadı.')
        return false
      }
    }

    // Save previous snapshot for undo functionality
    swipeHistoryRef.current.push({
      movie,
      action,
      previousProfile: tasteProfile,
    })

    // Learn only after the room accepted the swipe, so retries do not double-count taste.
    const updated = updateTasteWithSwipe(tasteProfile, movie, action)
    setTasteProfile(updated)
    if (authUser) {
      void syncProfileToCloud(updated)
    }

    if (action === 'watched') {
      setRecentlyWatchedMovie(movie)
    } else {
      setRecentlyWatchedMovie(null)
    }

    return true
  }

  const handleQuickRate = (movieId: number, rating: number) => {
    const updated = updateMovieRating(tasteProfile, movieId, rating)
    setTasteProfile(updated)
    if (authUser) {
      void syncProfileToCloud(updated)
    }
  }

  const handleUndo = useCallback(() => {
    const lastAction = swipeHistoryRef.current.pop()
    if (!lastAction) return

    setTasteProfile(lastAction.previousProfile)
    saveTasteProfile(lastAction.previousProfile)
    if (authUser) {
      void syncProfileToCloud(lastAction.previousProfile)
    }

    // If active in a room, delete the recorded swipe from Supabase so no false match triggers
    if (room) {
      void deleteRoomSwipe(room.id, userId, lastAction.movie.id, roundNumber)
      if (room.room_mode === 'group') {
        void updateParticipantPresence(
          room.id,
          userId,
          lastAction.previousProfile.username || 'Katılımcı',
          lastAction.previousProfile.avatar || '🍿',
          Math.max(0, initialSwipeIndex - 1)
        )
      }
    }
  }, [authUser, room, userId, roundNumber, initialSwipeIndex])

  const handleLoadNextRound = async () => {
    const nextPage = page + 1
    if (room) {
      swipeHistoryRef.current = []
      // Prepare this user's next 25-film deck, then advance the shared room round.
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
      // In solo mode: retain last 15 history items for smooth cross-page undo
      if (swipeHistoryRef.current.length > 15) {
        swipeHistoryRef.current = swipeHistoryRef.current.slice(-15)
      }
      loadMovies(nextPage, filters, true, 20)
    }
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    swipeHistoryRef.current = []
    setFilters(newFilters)
    setRoundNumber(1)
    if (!roomRef.current) {
      loadMovies(1, newFilters, false, 20)
    }
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
        <Suspense fallback={null}>
          <OnboardingFlow
            initialProfile={tasteProfile}
            onComplete={(completedProfile) => {
              setTasteProfile(completedProfile)
              if (!hasRoomContext()) {
                loadMovies(1, filters, false, 20)
              }
            }}
          />
        </Suspense>
      )}

      {/* PWA Mobile Install Prompt */}
      <PWAInstallBanner />

      {/* App Header */}
      <Header
        roomCode={room ? room.room_code : null}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
        onOpenFilter={activeTab === 'match' ? () => setIsFilterOpen(true) : undefined}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
        onOpenRoulette={() => setIsRouletteModalOpen(true)}
        selectedGenreName={headerFilterLabel}
        activeFilterCount={activeFilterCount}
      />

      {/* Partner Joined Toast Notification */}
      {partnerJoinedNotice && (
        <div className="absolute top-16 inset-x-4 z-40 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 py-2.5 px-4 rounded-2xl text-xs font-bold text-center shadow-xl shadow-emerald-950/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 flex items-center justify-center gap-2">
          <span>🎉</span>
          <span>{partnerJoinedNotice}</span>
        </div>
      )}

      {/* Partner Veto Toast Notification */}
      {partnerVetoNotice && (
        <div className="absolute top-16 inset-x-4 z-40 bg-red-950/90 border border-red-500/50 text-red-200 py-2.5 px-4 rounded-2xl text-xs font-bold text-center shadow-xl shadow-red-950/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 flex items-center justify-center gap-2">
          <span>🚫</span>
          <span>{partnerVetoNotice}</span>
        </div>
      )}
      {roomSyncError && (
        <div role="alert" className="absolute top-28 inset-x-4 z-40 bg-amber-950/95 border border-amber-500/50 text-amber-100 py-2.5 px-4 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="flex-1 text-center">{roomSyncError}</span>
          <button
            type="button"
            onClick={() => setRoomSyncError(null)}
            className="text-amber-400 hover:text-white p-1 rounded-md text-xs font-bold cursor-pointer shrink-0"
            title="Kapat"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">Yükleniyor...</div>}>
          {activeTab === 'news' && <NewsFeed />}

          {activeTab === 'match' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {room && room.status === 'waiting' && !isWaitingBypassed ? (
                <RoomWaitingLobby
                  room={room}
                  creatorName={tasteProfile.username || 'Kurucu'}
                  isCreator={Boolean(sessionStorage.getItem('neizlesek_created_room_code') === room.room_code)}
                  participants={groupParticipants}
                  onStartRoom={handleStartGroupRoom}
                  onStartSolo={() => setIsWaitingBypassed(true)}
                  onLeaveRoom={handleLeaveRoom}
                />
              ) : (
                /* Swipe Deck with infinite solo mode or 25-film room limit */
                <SwipeDeck
                  key={`${roundNumber}_${filters.genreId}_${filters.platformIds.join(',')}_${filters.yearRange}_${filters.minRating}_${room?.id || 'solo'}`}
                  movies={movies}
                  onSwipe={handleSwipe}
                  onUndo={handleUndo}
                  onLoadNextRound={handleLoadNextRound}
                  onResetGenre={() => handleApplyFilters(DEFAULT_FILTERS)}
                  isLoading={isLoading}
                  roundNumber={roundNumber}
                  roundLimit={25}
                  hasRoundLimit={!!room}
                  isRoomMode={!!room}
                  roomMode={room?.room_mode}
                  groupParticipants={groupParticipants}
                  totalSwipesCount={tasteProfile.totalSwipes}
                  onOpenDetails={setCardDetailMovie}
                  onOpenFallback={room && room.room_mode !== 'group' ? () => setIsFallbackOpen(true) : undefined}
                  onOpenGroupResults={room && room.room_mode === 'group' ? handleOpenGroupResults : undefined}
                  partnerSwipesCount={partnerSwipesCount}
                  initialIndex={initialSwipeIndex}
                  vetoedMovieIds={vetoedMovieIds}
                  userGenreScores={tasteProfile.genreScores}
                />
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <UserProfile
              tasteProfile={tasteProfile}
              activeRoom={room}
              partnerScores={partnerScores}
              authUser={authUser}
              onCreateRoom={handleCreateRoomAction}
              onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
              onLeaveRoom={handleLeaveRoom}
              onNavigateToMatch={() => setActiveTab('match')}
              onUpdateTasteProfile={(updated) => {
                setTasteProfile(updated)
                if (authUser) void syncProfileToCloud(updated)
              }}
              onStartCalibration={() => setIsCalibrationModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
            />
          )}
        </Suspense>
      </main>

      {/* Quick Rating Prompt when movie is swiped as watched */}
      <QuickRatingPrompt
        movie={recentlyWatchedMovie}
        onRate={handleQuickRate}
        onDismiss={() => setRecentlyWatchedMovie(null)}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasActiveRoom={!!room}
      />

      <Suspense fallback={null}>
        {/* Global Movie Search Modal */}
        <GlobalSearchModal
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
          onOpenDetails={(movie) => setCardDetailMovie(movie)}
          onLikeMovie={(movie) => {
            const updated = updateTasteWithSwipe(tasteProfile, movie, 'like')
            setTasteProfile(updated)
            if (authUser) void syncProfileToCloud(updated)
          }}
          onWatchMovie={(movie, rating) => {
            const updated = markMovieAsWatched(tasteProfile, movie, rating)
            setTasteProfile(updated)
            if (authUser) void syncProfileToCloud(updated)
          }}
          isLiked={(id) => (tasteProfile.likedMovies || []).some((m) => m.id === id)}
          isWatched={(id) => (tasteProfile.watchedMovieIds || []).includes(id)}
          getWatchedRating={(id) =>
            (tasteProfile.watchedMovies || []).find((w) => w.movie.id === id)?.rating
          }
        />

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          currentFilters={filters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Film Ruleti Modalı */}
        <MovieRouletteModal
          isOpen={isRouletteModalOpen}
          onClose={() => setIsRouletteModalOpen(false)}
          likedMovies={tasteProfile.likedMovies || []}
          matchedMovies={(tasteProfile.matchHistory || []).map((h) => h.movie)}
          onOpenDetails={(movie) => setCardDetailMovie(movie)}
        />

        {/* Movie Card Preview & Trailer Modal */}
        <MovieDetailModal
          movie={cardDetailMovie}
          listType="preview"
          isOpen={!!cardDetailMovie}
          onClose={() => setCardDetailMovie(null)}
          onSwipeFromModal={handleSwipe}
          onMarkAsWatched={(movie, rating) => {
            const updated = markMovieAsWatched(tasteProfile, movie, rating)
            setTasteProfile(updated)
            if (authUser) void syncProfileToCloud(updated)
          }}
          canVeto={!!room}
        />

        {/* Fallback Voting Modal (When no match after round) */}
        {room && room.room_mode !== 'group' && (
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
              if (room) {
                const updated = addMatchedMovie(
                  tasteProfileRef.current,
                  movie,
                  room.room_code,
                  room.partner_name || 'Partner'
                )
                setTasteProfile(updated)
              }
            }}
          />
        )}

        {/* Group Watch Party Voting Results & Podium Modal */}
        {room && room.room_mode === 'group' && (
          <GroupResultModal
            isOpen={isGroupResultsOpen}
            onClose={() => setIsGroupResultsOpen(false)}
            results={groupResults || []}
            vetoedMovies={movies.filter((m) => vetoedMovieIds.has(m.id))}
            totalParticipants={Math.max(groupParticipants.length, 2)}
            roundNumber={roundNumber}
            onNextRound={() => {
              setIsGroupResultsOpen(false)
              void handleLoadNextRound()
            }}
            onLeaveRoom={() => {
              setIsGroupResultsOpen(false)
              handleLeaveRoom()
            }}
            onSelectMovie={(movie) => {
              setMatchedMovie(movie)
              setIsMatchOpen(true)
              setIsGroupResultsOpen(false)
              if (room) {
                const updated = addMatchedMovie(
                  tasteProfileRef.current,
                  movie,
                  room.room_code,
                  'Watch Party Grubu'
                )
                setTasteProfile(updated)
              }
            }}
          />
        )}

        {/* Match Celebration Modal */}
        <MatchModal
          movie={matchedMovie}
          isOpen={isMatchOpen}
          onClose={() => setIsMatchOpen(false)}
        />

        {/* Cloud Account & Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentProfile={tasteProfile}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Reopenable 30 Movie Calibration Modal */}
        {isCalibrationModalOpen && (
          <OnboardingFlow
            initialProfile={tasteProfile}
            startAtColdStart={true}
            onClose={() => setIsCalibrationModalOpen(false)}
            onComplete={(completedProfile) => {
              setTasteProfile(completedProfile)
              setIsCalibrationModalOpen(false)
              if (authUser) void syncProfileToCloud(completedProfile)
            }}
          />
        )}
      </Suspense>
    </div>
  )
}

export default App
