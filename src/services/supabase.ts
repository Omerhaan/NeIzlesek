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

// Record a swipe action with duplicate protection
export async function recordSwipe(
  roomId: string,
  userId: string,
  movieId: number,
  action: SwipeAction
): Promise<void> {
  try {
    // Attempt upsert with onConflict on (room_id, user_id, movie_id)
    const { error } = await supabase.from('room_swipes').upsert(
      [
        {
          room_id: roomId,
          user_id: userId,
          movie_id: movieId,
          action: action,
        },
      ],
      { onConflict: 'room_id,user_id,movie_id' }
    )

    if (error) {
      // Fallback standard insert if table doesn't have unique constraint yet
      const { error: insertErr } = await supabase.from('room_swipes').insert([
        {
          room_id: roomId,
          user_id: userId,
          movie_id: movieId,
          action: action,
        },
      ])
      if (insertErr) {
        console.error('Error recording swipe:', insertErr)
      }
    }
  } catch (err) {
    console.error('Record swipe exception:', err)
  }
}

// Fetch un-vetoed, most liked candidate movie IDs for fallback matching
export async function fetchRoomFallbackCandidates(roomId: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('room_swipes')
      .select('movie_id, action, user_id')
      .eq('room_id', roomId)

    if (error || !data) return []

    // Collect vetoed movies and liked counts
    const vetoedIds = new Set<number>()
    const likeCounts: Record<number, number> = {}

    for (const s of data) {
      if (s.action === 'veto') {
        vetoedIds.add(s.movie_id)
      } else if (s.action === 'like') {
        likeCounts[s.movie_id] = (likeCounts[s.movie_id] || 0) + 1
      }
    }

    // Filter out vetoed movies and sort by likes
    const candidateIds = Object.keys(likeCounts)
      .map(Number)
      .filter((id) => !vetoedIds.has(id))
      .sort((a, b) => likeCounts[b] - likeCounts[a])

    return candidateIds.slice(0, 3)
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
    throw new Error(error.message)
  }
}

// Subscribe to real-time changes in a room (Match status + Veto events)
export function subscribeToRoom(
  roomId: string,
  onMatch: (matchedMovieId: number) => void,
  onVeto?: (vetoedMovieId: number, vetoUserId: string) => void
) {
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
          onMatch(newRecord.matched_movie_id)
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
        const swipe = payload.new as { movie_id: number; action: string; user_id: string }
        if (swipe && swipe.action === 'veto' && onVeto) {
          onVeto(swipe.movie_id, swipe.user_id)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
