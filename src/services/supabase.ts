import { createClient } from '@supabase/supabase-js'
import type { Room, SwipeAction, GroupParticipant, RoomMode } from '../types'
import { supabaseClientConfig } from '../config'

export const supabase = createClient(supabaseClientConfig.url, supabaseClientConfig.anonKey)

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

// Create a new match room (supports 'pair' for 2 people or 'group' for 3-5 friends)
export async function createRoom(
  creatorName = 'Kurucu',
  initialDeck: number[] = [],
  mode: RoomMode = 'pair',
  maxParticipants = mode === 'group' ? 5 : 2
): Promise<Room> {
  const roomCode = generateRoomCode()
  const insertPayload: Record<string, any> = {
    room_code: roomCode,
    creator_name: creatorName,
    partner_name: null,
    status: 'waiting',
    round_number: 1,
    selected_platform: mode, // stores 'pair' or 'group' mode reliably
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

  const room = data as Room
  room.room_mode = (data.selected_platform === 'group' ? 'group' : 'pair') as RoomMode
  room.max_participants = maxParticipants
  return room
}

// Join an existing room as a partner/friend
export async function joinRoom(roomId: string, partnerName = 'Partner'): Promise<Room> {
  // First fetch current room to see if it is pair or group
  const { data: currentRoom } = await supabase
    .from('match_rooms')
    .select('partner_name, selected_platform, status')
    .eq('id', roomId)
    .single()

  const isGroup = currentRoom?.selected_platform === 'group'
  let newPartnerName = partnerName

  if (isGroup && currentRoom?.partner_name) {
    const existing = currentRoom.partner_name.split(',').map((s: string) => s.trim()).filter(Boolean)
    if (!existing.includes(partnerName)) {
      existing.push(partnerName)
    }
    newPartnerName = existing.join(', ')
  }

  const { data, error } = await supabase
    .from('match_rooms')
    .update({
      partner_name: newPartnerName,
      status: isGroup ? currentRoom?.status || 'waiting' : 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .select()
    .single()

  if (error) {
    console.error('Error joining room:', error)
    throw new Error(error.message)
  }

  const room = data as Room
  room.room_mode = isGroup ? 'group' : 'pair'
  room.max_participants = isGroup ? 5 : 2
  return room
}

// Manually activate room when creator starts the group session
export async function activateRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('match_rooms')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', roomId)

  if (error) {
    console.warn('Error activating room:', error.message)
  }
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

  const room = data as Room
  room.room_mode = (data.selected_platform === 'group' ? 'group' : 'pair') as RoomMode
  room.max_participants = room.room_mode === 'group' ? 5 : 2
  return room
}

// Record a swipe action using the Supabase schema's user_name column
export async function recordSwipe(
  roomId: string,
  userId: string,
  movieId: number,
  action: SwipeAction,
  roundNumber: number
): Promise<void> {
  // Map client swipe actions to valid Supabase constraint values ('like', 'pass', 'veto').
  // 'watched' is tracked in local taste profile, and acts as a neutral pass for the room match session.
  const dbAction: 'like' | 'pass' | 'veto' =
    action === 'watched' ? 'pass' : action === 'superlike' ? 'like' : action

  const payload = {
    room_id: roomId,
    user_name: userId,
    movie_id: movieId,
    action: dbAction,
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
        ignoreDuplicates: false,
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
  if (dbAction === 'like') {
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
  // Direct update without altering room status (preserves 'waiting' or 'active')
  const { data: updateData, error: updateError } = await supabase
    .from('match_rooms')
    .update({ room_deck: movieIds, updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select('room_deck')
    .maybeSingle()

  if (!updateError && updateData?.room_deck) {
    return updateData.room_deck as number[]
  }

  // Fallback to RPC if direct update failed
  try {
    const { data, error } = await supabase.rpc('initialize_room_deck', {
      p_room_id: roomId,
      p_movie_ids: movieIds,
    })

    if (!error) {
      const result = Array.isArray(data) ? data[0] : data
      if (result?.room_deck) return result.room_deck as number[]
    }
  } catch {
    // Ignore RPC failure
  }

  return movieIds
}

// Each participant keeps a private-to-the-room movie queue; falls back to match_rooms.room_deck if table not yet created.
export async function getRoomUserDeck(roomId: string, userId: string, roundNumber: number): Promise<number[] | null> {
  const { data, error } = await supabase.from('room_user_decks').select('movie_ids')
    .eq('room_id', roomId).eq('user_id', userId).eq('round_number', roundNumber).maybeSingle()
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return null // Table does not exist in Supabase yet; gracefully fall back
    }
    console.warn(`Kişisel oda destesi alınamadı: ${error.message}`)
    return null
  }
  return data?.movie_ids ?? null
}

export async function saveRoomUserDeck(roomId: string, userId: string, roundNumber: number, movieIds: number[]): Promise<number[]> {
  const { data, error } = await supabase.from('room_user_decks')
    .upsert({ room_id: roomId, user_id: userId, round_number: roundNumber, movie_ids: movieIds },
      { onConflict: 'room_id,user_id,round_number', ignoreDuplicates: true })
    .select('movie_ids').maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      // Table does not exist in Supabase yet; fall back to match_rooms.room_deck
      await setRoomDeck(roomId, movieIds)
      return movieIds
    }
    console.warn(`Kişisel oda destesi kaydedilemedi, ortak desteye yazılıyor: ${error.message}`)
    await setRoomDeck(roomId, movieIds)
    return movieIds
  }

  if (data?.movie_ids) return data.movie_ids
  const saved = await getRoomUserDeck(roomId, userId, roundNumber)
  return saved || movieIds
}

export async function saveRoomParticipantTaste(roomId: string, userId: string, genreScores: Record<number, number>, watchedIds: number[]): Promise<void> {
  const { error } = await supabase.from('room_participant_tastes').upsert({
    room_id: roomId, user_id: userId, genre_scores: genreScores, watched_movie_ids: watchedIds,
  }, { onConflict: 'room_id,user_id' })

  if (error) {
    // Non-fatal telemetry; ignore if table is missing
    if (error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      console.warn(`Oda zevk profili kaydedilemedi: ${error.message}`)
    }
  }
}

export async function fetchPartnerGenreScores(roomId: string, myUserId: string): Promise<Record<number, number> | null> {
  const { data, error } = await supabase
    .from('room_participant_tastes')
    .select('genre_scores, user_id')
    .eq('room_id', roomId)
    .neq('user_id', myUserId)
    .maybeSingle()

  if (error || !data) return null
  return (data.genre_scores as Record<number, number>) || null
}

export function broadcastTasteScores(roomId: string, myUserId: string, genreScores: Record<number, number>) {
  const channel = supabase.channel(`room_${roomId}`)
  void channel.send({
    type: 'broadcast',
    event: 'taste_sync',
    payload: { userId: myUserId, genreScores },
  })
}

export async function fetchRoomUsedMovieIds(roomId: string, userId: string): Promise<number[]> {
  const { data, error } = await supabase.from('room_swipes').select('movie_id')
    .eq('room_id', roomId).eq('user_name', userId)
  if (error) {
    console.warn(`Odada daha önce görülen filmler alınamadı: ${error.message}`)
    return []
  }
  return Array.from(new Set((data ?? []).map((row) => row.movie_id)))
}

export async function getLegacyRoomDeck(roomId: string, roundNumber: number): Promise<number[] | null> {
  const { data, error } = await supabase.from('match_rooms').select('room_deck, round_number')
    .eq('id', roomId).maybeSingle()
  if (error) {
    console.warn(`Eski oda destesi alınamadı: ${error.message}`)
    return null
  }
  if (Number(data?.round_number) !== roundNumber || !Array.isArray(data?.room_deck) || data.room_deck.length === 0) return null
  return data.room_deck as number[]
}

export async function fetchRoomSharedTasteGenres(roomId: string): Promise<number[]> {
  const { data, error } = await supabase.from('room_participant_tastes').select('genre_scores')
    .eq('room_id', roomId).limit(2)
  if (error) {
    return [] // Table may not exist yet
  }
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

// Fetch swipe progress for each group participant in round
export async function fetchRoomGroupSwipesCount(
  roomId: string,
  roundNumber: number
): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('room_swipes')
      .select('user_name, movie_id')
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)

    if (error || !data) return {}

    const counts: Record<string, Set<number>> = {}
    for (const row of data) {
      if (!row.user_name) continue
      if (!counts[row.user_name]) counts[row.user_name] = new Set()
      counts[row.user_name].add(row.movie_id)
    }

    const result: Record<string, number> = {}
    for (const [user, set] of Object.entries(counts)) {
      result[user] = set.size
    }
    return result
  } catch (err) {
    console.error('Error fetching group swipes count:', err)
    return {}
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

export interface SubscribeToRoomOptions {
  myParticipantInfo?: { username: string; avatar?: string }
  onParticipantsChanged?: (participants: GroupParticipant[]) => void
  onRoomActivated?: () => void
}

// Subscribe to real-time changes in a room (Match status, Vetoes, Swipe progress, Presence + Polling fallback)
export function subscribeToRoom(
  roomId: string,
  roundNumber: number,
  myUserId: string,
  onMatch: (matchedMovieId: number) => void,
  onVeto?: (vetoedMovieId: number, vetoUserId: string) => void,
  onPartnerSwiped?: (partnerSwipeCount: number) => void,
  onRoundChanged?: (round: number) => void,
  onPartnerJoined?: (partnerName: string) => void,
  alreadyHasPartner = false,
  onPartnerTasteReceived?: (scores: Record<number, number>) => void,
  myGenreScores?: Record<number, number>,
  options?: SubscribeToRoomOptions
) {
  let notifiedMatchId: number | null = null
  let notifiedPartner = alreadyHasPartner

  const notifyMatchOnce = (movieId: number) => {
    if (notifiedMatchId === movieId) return
    notifiedMatchId = movieId
    onMatch(movieId)
  }

  const notifyPartnerOnce = (partnerName?: string | null) => {
    if (notifiedPartner || !partnerName || partnerName.trim() === '') return
    notifiedPartner = true
    onPartnerJoined?.(partnerName.trim())
  }

  // 1. Supabase Realtime channel with Presence support
  const channel = supabase
    .channel(`room_${roomId}`, {
      config: {
        presence: {
          key: myUserId,
        },
      },
    })
    .on(
      'broadcast',
      { event: 'taste_sync' },
      (payload) => {
        const data = payload?.payload as { userId: string; genreScores: Record<number, number> } | undefined
        if (data && data.userId !== myUserId && data.genreScores) {
          onPartnerTasteReceived?.(data.genreScores)
          // Echo our taste back if available so partner is guaranteed to have it
          if (myGenreScores && Object.keys(myGenreScores).length > 0) {
            void channel.send({
              type: 'broadcast',
              event: 'taste_sync',
              payload: { userId: myUserId, genreScores: myGenreScores },
            })
          }
        }
      }
    )

  const dispatchParticipants = () => {
    const presenceState = channel.presenceState<{
      userId?: string
      username?: string
      avatar?: string
      swipesCount?: number
      isReady?: boolean
    }>()

    const list: GroupParticipant[] = []
    for (const key of Object.keys(presenceState)) {
      const presences = presenceState[key]
      if (presences && presences.length > 0) {
        const p = presences[presences.length - 1]
        list.push({
          userId: p.userId || key,
          username: p.username || 'Katılımcı',
          avatar: p.avatar || '🍿',
          swipesCount: p.swipesCount || 0,
          isReady: p.isReady ?? true,
        })
      }
    }
    options?.onParticipantsChanged?.(list)
  }

  channel
    .on('presence', { event: 'sync' }, dispatchParticipants)
    .on('presence', { event: 'join' }, dispatchParticipants)
    .on('presence', { event: 'leave' }, dispatchParticipants)
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
        if (newRecord.status === 'active') {
          options?.onRoomActivated?.()
        }
        if (newRecord.round_number && newRecord.round_number > roundNumber) {
          onRoundChanged?.(newRecord.round_number)
        }
        if (newRecord.partner_name) {
          notifyPartnerOnce(newRecord.partner_name)
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
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        if (myGenreScores && Object.keys(myGenreScores).length > 0) {
          void channel.send({
            type: 'broadcast',
            event: 'taste_sync',
            payload: { userId: myUserId, genreScores: myGenreScores },
          })
        }
        if (options?.myParticipantInfo) {
          try {
            await channel.track({
              userId: myUserId,
              username: options.myParticipantInfo.username || 'Katılımcı',
              avatar: options.myParticipantInfo.avatar || '🍿',
              swipesCount: 0,
              isReady: true,
            })
          } catch (err) {
            console.warn('Presence track error:', err)
          }
        }
      }
    })

  // 2. Unbreakable polling fallback (every 2.5s) to guarantee matching and partner swipe sync even if Realtime is unavailable
  const pollInterval = setInterval(async () => {
    try {
      const { data } = await supabase
        .from('match_rooms')
        .select('status, matched_movie_id, round_number, partner_name')
        .eq('id', roomId)
        .single()

      if (data && data.status === 'matched' && data.matched_movie_id) {
        notifyMatchOnce(data.matched_movie_id)
      }
      if (data && data.status === 'active') {
        options?.onRoomActivated?.()
      }
      if (data?.round_number && data.round_number > roundNumber) {
        onRoundChanged?.(data.round_number)
      }
      if (data && data.partner_name) {
        notifyPartnerOnce(data.partner_name)
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

// Track active participant presence updates (e.g. swipes count)
export async function updateParticipantPresence(
  roomId: string,
  myUserId: string,
  username: string,
  avatar: string,
  swipesCount: number
): Promise<void> {
  try {
    const channel = supabase.channel(`room_${roomId}`)
    await channel.track({
      userId: myUserId,
      username,
      avatar,
      swipesCount,
      isReady: true,
    })
  } catch {
    // Non-critical presence update error
  }
}

// -------------------------------------------------------------
// Cloud Account & Authentication (Supabase Auth)
// -------------------------------------------------------------

export async function getCurrentAuthUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return null
    return session.user
  } catch {
    return null
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Sign out error:', err)
  }
}

export async function syncProfileToCloud(profile: any): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return false

    const { error } = await supabase.auth.updateUser({
      data: {
        taste_profile: profile,
        username: profile.username,
        avatar: profile.avatar,
        updated_at: new Date().toISOString(),
      },
    })
    return !error
  } catch (err) {
    console.warn('Failed to sync profile to cloud:', err)
    return false
  }
}
