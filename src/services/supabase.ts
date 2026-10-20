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

// Create a new match room
export async function createRoom(): Promise<Room> {
  const roomCode = generateRoomCode()
  const { data, error } = await supabase
    .from('match_rooms')
    .insert([
      {
        room_code: roomCode,
        status: 'waiting',
      },
    ])
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
  try {
    const { error } = await supabase.from('room_swipes').insert([
      {
        room_id: roomId,
        user_name: userId,
        movie_id: movieId,
        action: action,
        round_number: roundNumber,
      },
    ])

    if (error) {
      console.error('Error recording swipe:', error)
    }

    // If action is 'like', check if partner also liked this movie as a fail-safe backup to DB trigger
    if (action === 'like') {
      const { data: partnerLikes } = await supabase
        .from('room_swipes')
        .select('id, user_name')
        .eq('room_id', roomId)
        .eq('movie_id', movieId)
        .eq('action', 'like')
        .neq('user_name', userId)
        .limit(1)

      if (partnerLikes && partnerLikes.length > 0) {
        await setRoomMatchedMovie(roomId, movieId)
      }
    }
  } catch (err) {
    console.error('Record swipe exception:', err)
  }
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
  try {
    const { data, error } = await supabase
      .from('room_swipes')
      .select('user_name, movie_id')
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)

    if (error || !data) return { myCount: 0, partnerCount: 0 }

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
  } catch (err) {
    console.error('Failed to fetch room swipes count:', err)
    return { myCount: 0, partnerCount: 0 }
  }
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
  onRoundChanged?: (round: number, deck: number[]) => void
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
        if (newRecord.round_number && newRecord.round_number > roundNumber && newRecord.room_deck?.length) {
          onRoundChanged?.(newRecord.round_number, newRecord.room_deck)
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
              onPartnerSwiped(1)
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
        .select('status, matched_movie_id, round_number, room_deck')
        .eq('id', roomId)
        .single()

      if (data && data.status === 'matched' && data.matched_movie_id) {
        notifyMatchOnce(data.matched_movie_id)
      }
      if (data?.round_number && data.round_number > roundNumber && data.room_deck?.length) {
        onRoundChanged?.(data.round_number, data.room_deck)
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
