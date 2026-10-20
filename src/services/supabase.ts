import { createClient } from '@supabase/supabase-js'
import type { Room, SwipeAction } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Generate a random 6-character room code (uppercase alphanumeric)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Get or create a persistent anonymous user ID
export function getOrCreateUserId(): string {
  let userId = localStorage.getItem('neizlesek_user_id')
  if (!userId) {
    userId = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
    localStorage.setItem('neizlesek_user_id', userId)
  }
  return userId
}

// Create a new match room (optionally with an initial curated 25-movie deck)
export async function createRoom(initialDeck: number[] = []): Promise<Room> {
  const roomCode = generateRoomCode()
  const insertPayload: Record<string, any> = {
    room_code: roomCode,
    status: initialDeck.length > 0 ? 'active' : 'waiting',
    round_number: 1,
  }
  if (initialDeck.length > 0) {
    insertPayload.room_deck = initialDeck
  }

  const { data, error } = await supabase
    .from('match_rooms')
    .insert([insertPayload])
    .select()
    .single()

  if (error) {
    console.error('Error creating room:', error)
    throw new Error(error.message)
  }

  return data as Room
}

// Find room by 6-character code
export async function getRoomByCode(code: string): Promise<Room | null> {
  const cleanCode = code.trim().toUpperCase()
  const { data, error } = await supabase
    .from('match_rooms')
    .select('*')
    .eq('room_code', cleanCode)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Room not found
    }
    console.error('Error fetching room:', error)
    throw new Error(error.message)
  }

  return data as Room
}

// Record a swipe action using the Supabase schema's user_name column
export async function recordSwipe(
  roomId: string,
  userId: string,
  movieId: number,
  action: SwipeAction,
  roundNumber: number
): Promise<void> {
  const payload = {
    room_id: roomId,
    user_name: userId,
    movie_id: movieId,
    action,
    round_number: roundNumber,
  }

  let saved = false
  let lastError: unknown
  for (let attempt = 0; attempt < 3 && !saved; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    try {
      const { error } = await supabase.from('room_swipes').upsert(payload, {
        onConflict: 'room_id,user_name,movie_id,round_number',
        ignoreDuplicates: true,
      }).abortSignal(controller.signal)
      if (error) throw error
      saved = true
    } catch (error) {
      lastError = error
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 350 * 2 ** attempt))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  if (!saved) {
    const message = lastError instanceof Error ? lastError.message : 'Bilinmeyen Supabase hatası'
    throw new Error(`Swipe kaydedilemedi: ${message}`)
  }

  // The SQL trigger is authoritative; this query is only a best-effort backup.
  if (action === 'like') {
    // Do not hold up the deck on this redundant check: the database trigger
    // already handles matching, and a slow read must never freeze card progress.
    void Promise.resolve(
      supabase
        .from('room_swipes')
        .select('id, user_name')
        .eq('room_id', roomId)
        .eq('movie_id', movieId)
        .eq('round_number', roundNumber)
        .eq('action', 'like')
        .neq('user_name', userId)
        .limit(1)
        .then(({ data, error }) => {
          if (!error && data?.length) return setRoomMatchedMovie(roomId, movieId)
        })
    )
      .catch((error) => console.error('Optional match backup check failed:', error))
  }
}

export async function fetchRoomVetoedMovieIds(roomId: string, roundNumber: number): Promise<number[]> {
  const { data, error } = await supabase
    .from('room_swipes')
    .select('movie_id')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)
    .eq('action', 'veto')

  if (error) throw new Error(`Veto edilen filmler alınamadı: ${error.message}`)
  return Array.from(new Set((data ?? []).map((row) => row.movie_id)))
}

// Save the curated 25 movie IDs for the room so both devices get identical movies
export async function setRoomDeck(roomId: string, movieIds: number[]): Promise<number[]> {
  const { data, error } = await supabase.rpc('initialize_room_deck', {
    p_room_id: roomId,
    p_movie_ids: movieIds,
  })

  if (error) throw new Error(`Failed to initialize room deck: ${error.message}`)
  const result = Array.isArray(data) ? data[0] : data
  if (!result?.room_deck) throw new Error('Room deck initialization returned no deck')
  return result.room_deck as number[]
}

// Each participant keeps a private-to-the-room movie queue; room_deck is legacy only.
export async function getRoomUserDeck(roomId: string, userId: string, roundNumber: number): Promise<number[] | null> {
  const { data, error } = await supabase.from('room_user_decks').select('movie_ids')
    .eq('room_id', roomId).eq('user_id', userId).eq('round_number', roundNumber).maybeSingle()
  if (error) throw new Error(`Kişisel oda destesi alınamadı: ${error.message}`)
  return data?.movie_ids ?? null
}

export async function saveRoomUserDeck(roomId: string, userId: string, roundNumber: number, movieIds: number[]): Promise<number[]> {
  const { data, error } = await supabase.from('room_user_decks')
    .upsert({ room_id: roomId, user_id: userId, round_number: roundNumber, movie_ids: movieIds },
      { onConflict: 'room_id,user_id,round_number', ignoreDuplicates: true })
    .select('movie_ids').maybeSingle()
  if (error) throw new Error(`Kişisel oda destesi kaydedilemedi: ${error.message}`)
  if (data?.movie_ids) return data.movie_ids
  const saved = await getRoomUserDeck(roomId, userId, roundNumber)
  if (!saved) throw new Error('Kişisel oda destesi kaydedildi ancak geri okunamadı.')
  return saved
}

export async function saveRoomParticipantTaste(roomId: string, userId: string, genreScores: Record<number, number>, watchedIds: number[]): Promise<void> {
  const { error } = await supabase.from('room_participant_tastes').upsert({
    room_id: roomId, user_id: userId, genre_scores: genreScores, watched_movie_ids: watchedIds,
  }, { onConflict: 'room_id,user_id' })
  if (error) throw new Error(`Oda zevk profili kaydedilemedi: ${error.message}`)
}

export async function fetchRoomUsedMovieIds(roomId: string, userId: string): Promise<number[]> {
  const { data, error } = await supabase.from('room_swipes').select('movie_id')
    .eq('room_id', roomId).eq('user_name', userId)
  if (error) throw new Error(`Odada daha önce görülen filmler alınamadı: ${error.message}`)
  return Array.from(new Set((data ?? []).map((row) => row.movie_id)))
}

export async function fetchRoomSharedTasteGenres(roomId: string): Promise<number[]> {
  const { data, error } = await supabase.from('room_participant_tastes').select('genre_scores')
    .eq('room_id', roomId).limit(2)
  if (error) throw new Error(`Ortak zevk profili alınamadı: ${error.message}`)
  if (!data || data.length < 2) return []
  const [first, second] = data.map((row) => row.genre_scores as Record<string, number>)
  const normalize = (scores: Record<string, number>) => {
    const max = Math.max(1, ...Object.values(scores).map((score) => Math.max(0, Number(score) || 0)))
    return new Map(Object.entries(scores).map(([id, score]) => [Number(id), Math.max(0, Number(score) || 0) / max]))
  }
  const a = normalize(first ?? {})
  const b = normalize(second ?? {})
  return Array.from(a.keys())
    .map((id) => [id, Math.sqrt((a.get(id) ?? 0) * (b.get(id) ?? 0))] as const)
    .filter(([, score]) => score > 0)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 3)
    .map(([id]) => id)
}

export async function advanceRoomRound(
  roomId: string,
  expectedRound: number,
  movieIds: number[]
): Promise<{ round_number: number; room_deck: number[] }> {
  const { data, error } = await supabase.rpc('advance_room_round', {
    p_room_id: roomId,
    p_expected_round: expectedRound,
    p_movie_ids: movieIds,
  })

  if (error) throw new Error(`Failed to advance room round: ${error.message}`)
  const result = Array.isArray(data) ? data[0] : data
  if (!result?.round_number || !result?.room_deck) {
    throw new Error('Room round update returned no deck')
  }
  return result as { round_number: number; room_deck: number[] }
}

// Fetch swipe counts for both current user and partner in a room
export async function fetchRoomSwipesCount(
  roomId: string,
  myUserId: string,
  roundNumber: number
): Promise<{ myCount: number; partnerCount: number }> {
  const { data, error } = await supabase
    .from('room_swipes')
    .select('user_name, movie_id')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)

  if (error) throw new Error(`Swipe ilerlemesi alınamadı: ${error.message}`)
  if (!data) throw new Error('Swipe ilerlemesi boş yanıt döndürdü')

  const myMovies = new Set<number>()
  const partnerMovies = new Set<number>()

  for (const row of data) {
    if (row.user_name === myUserId) {
      myMovies.add(row.movie_id)
    } else if (row.user_name) {
      partnerMovies.add(row.movie_id)
    }
  }

  return { myCount: myMovies.size, partnerCount: partnerMovies.size }
}

// Fetch un-vetoed, most liked candidate movie IDs for fallback matching
export async function fetchRoomFallbackCandidates(roomId: string, roundNumber: number): Promise<number[]> {
  try {
    const { data: swipesData } = await supabase
      .from('room_swipes')
      .select('movie_id, action, user_name')
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)

    // Collect vetoed movies and liked counts
    const vetoedIds = new Set<number>()
    const likeCounts: Record<number, number> = {}

    if (swipesData) {
      for (const s of swipesData) {
        if (s.action === 'veto') {
          vetoedIds.add(s.movie_id)
        } else if (s.action === 'like') {
          likeCounts[s.movie_id] = (likeCounts[s.movie_id] || 0) + 1
        }
      }
    }

    // Filter out vetoed movies and sort by likes
    const candidateIds = Object.keys(likeCounts)
      .map(Number)
      .filter((id) => !vetoedIds.has(id))
      .sort((a, b) => likeCounts[b] - likeCounts[a])

    if (candidateIds.length > 0) {
      return candidateIds.slice(0, 3)
    }

    // Fallback: If no liked movies, pick first 3 un-vetoed movies from current room deck
    const { data: roomData } = await supabase
      .from('match_rooms')
      .select('room_deck')
      .eq('id', roomId)
      .single()

    if (roomData?.room_deck && Array.isArray(roomData.room_deck)) {
      const deckCandidates = (roomData.room_deck as number[])
        .filter((id) => !vetoedIds.has(id))
        .slice(0, 3)
      return deckCandidates
    }

    return []
  } catch (err) {
    console.error('Failed to fetch fallback candidates:', err)
    return []
  }
}

export async function fetchRoomRoundLikes(
  roomId: string,
  roundNumber: number
): Promise<{ sharedLikeIds: number[]; likedMovieIds: number[]; styleSeedIds: number[]; vetoedMovieIds: number[] }> {
  const { data, error } = await supabase
    .from('room_swipes')
    .select('movie_id, action, user_name')
    .eq('room_id', roomId)
    .eq('round_number', roundNumber)

  if (error || !data) throw new Error(error?.message ?? 'Tur oyları alınamadı')

  const likesByUser = new Map<string, Set<number>>()
  const likedMovieIds = new Set<number>()
  const vetoedMovieIds = new Set<number>()
  for (const row of data) {
    if (row.action === 'veto') vetoedMovieIds.add(row.movie_id)
    if (row.action !== 'like' || !row.user_name) continue
    likedMovieIds.add(row.movie_id)
    const userLikes = likesByUser.get(row.user_name) ?? new Set<number>()
    userLikes.add(row.movie_id)
    likesByUser.set(row.user_name, userLikes)
  }

  const participants = Array.from(likesByUser.values())
  const sharedLikeIds = participants.length >= 2
    ? Array.from(participants[0]).filter((id) => participants.slice(1).every((likes) => likes.has(id)))
    : []
  const styleSeedIds = Array.from(new Set(participants.flatMap((likes) => Array.from(likes).slice(0, 4))))

  return {
    sharedLikeIds: sharedLikeIds.filter((id) => !vetoedMovieIds.has(id)),
    likedMovieIds: Array.from(likedMovieIds),
    styleSeedIds,
    vetoedMovieIds: Array.from(vetoedMovieIds),
  }
}

// Manually trigger matched movie for a room (e.g. from fallback voting)
export async function setRoomMatchedMovie(roomId: string, movieId: number): Promise<void> {
  const { error } = await supabase
    .from('match_rooms')
    .update({ status: 'matched', matched_movie_id: movieId })
    .eq('id', roomId)

  if (error) {
    console.error('Error updating matched movie in room:', error)
  }
}

// Subscribe to real-time changes in a room (Match status, Vetoes, Swipe progress, + Polling fallback)
export function subscribeToRoom(
  roomId: string,
  roundNumber: number,
  myUserId: string,
  onMatch: (matchedMovieId: number) => void,
  onVeto?: (vetoedMovieId: number, vetoUserId: string) => void,
  onPartnerSwiped?: (partnerSwipeCount: number) => void,
  onRoundChanged?: (round: number) => void
) {
  let notifiedMatchId: number | null = null
  const notifyMatchOnce = (movieId: number) => {
    if (notifiedMatchId === movieId) return
    notifiedMatchId = movieId
    onMatch(movieId)
  }

  // 1. Supabase Realtime channel
  const channel = supabase
    .channel(`room_${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'match_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const newRecord = payload.new as Room
        if (newRecord.status === 'matched' && newRecord.matched_movie_id) {
          notifyMatchOnce(newRecord.matched_movie_id)
        }
        if (newRecord.round_number && newRecord.round_number > roundNumber) {
          onRoundChanged?.(newRecord.round_number)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'room_swipes',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const swipe = payload.new as { movie_id: number; action: string; user_name: string; round_number: number }
        if (swipe) {
          const isPartner = swipe.user_name && swipe.user_name !== myUserId
          const isCurrentRound = Number(swipe.round_number) === Number(roundNumber)

          if (isPartner && isCurrentRound) {
            if (swipe.action === 'veto' && onVeto) {
              onVeto(swipe.movie_id, swipe.user_name)
            }
            if (onPartnerSwiped) {
              void fetchRoomSwipesCount(roomId, myUserId, roundNumber).then(({ partnerCount }) => {
                onPartnerSwiped(partnerCount)
              }).catch((error) => console.error('Failed to refresh partner progress:', error))
            }
          }
        }
      }
    )
    .subscribe()

  // 2. Unbreakable polling fallback (every 2.5s) to guarantee matching and partner swipe sync even if Realtime is unavailable
  const pollInterval = setInterval(async () => {
    try {
      const { data } = await supabase
        .from('match_rooms')
        .select('status, matched_movie_id, round_number')
        .eq('id', roomId)
        .single()

      if (data && data.status === 'matched' && data.matched_movie_id) {
        notifyMatchOnce(data.matched_movie_id)
      }
      if (data?.round_number && data.round_number > roundNumber) {
        onRoundChanged?.(data.round_number)
      }

      // Sync exact partner swipes count periodically
      if (onPartnerSwiped) {
        const { partnerCount } = await fetchRoomSwipesCount(roomId, myUserId, roundNumber)
        onPartnerSwiped(partnerCount)
      }
    } catch {
      // Ignore polling errors
    }
  }, 2500)

  return () => {
    clearInterval(pollInterval)
    supabase.removeChannel(channel)
  }
}
