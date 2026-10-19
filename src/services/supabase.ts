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

// Record a swipe action
export async function recordSwipe(
  roomId: string,
  userId: string,
  movieId: number,
  action: SwipeAction
): Promise<void> {
  const { error } = await supabase.from('room_swipes').insert([
    {
      room_id: roomId,
      user_id: userId,
      movie_id: movieId,
      action: action,
    },
  ])

  if (error) {
    console.error('Error recording swipe:', error)
    throw new Error(error.message)
  }
}

// Subscribe to real-time changes in a room
export function subscribeToRoom(
  roomId: string,
  onMatch: (matchedMovieId: number) => void
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
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
