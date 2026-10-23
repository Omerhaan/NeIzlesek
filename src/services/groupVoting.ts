import { supabase } from './supabase'
import type { Movie, GroupVoteResult } from '../types'

/**
 * Calculates majority votes for group rooms (3-5 participants).
 * Sorts candidates:
 * 1. Filter out vetoed movies completely
 * 2. Ranked by highest number of likes / superlikes
 * 3. Tie-breaker by TMDb rating
 */
export async function calculateGroupVotingResults(
  roomId: string,
  roundNumber: number,
  movies: Movie[],
  totalParticipants: number
): Promise<GroupVoteResult[]> {
  try {
    const { data: swipes, error } = await supabase
      .from('room_swipes')
      .select('movie_id, action, user_name')
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)

    if (error || !swipes) {
      console.warn('Grup oyları alınamadı:', error?.message)
      return []
    }

    const vetoedIds = new Set<number>()
    const movieVotes = new Map<number, { count: number; voters: Set<string> }>()

    for (const swipe of swipes) {
      const movieId = Number(swipe.movie_id)
      const action = swipe.action

      if (action === 'veto') {
        vetoedIds.add(movieId)
      } else if (action === 'like' || action === 'superlike') {
        if (!movieVotes.has(movieId)) {
          movieVotes.set(movieId, { count: 0, voters: new Set() })
        }
        const entry = movieVotes.get(movieId)!
        entry.count += action === 'superlike' ? 1.5 : 1
        entry.voters.add(swipe.user_name)
      }
    }

    const movieMap = new Map<number, Movie>(movies.map((m) => [m.id, m]))
    const results: GroupVoteResult[] = []
    const totalCount = Math.max(totalParticipants, 2)

    for (const [movieId, { count, voters }] of movieVotes.entries()) {
      const movie = movieMap.get(movieId)
      if (!movie) continue

      const isVetoed = vetoedIds.has(movieId)
      const percentage = Math.min(100, Math.round((voters.size / totalCount) * 100))

      results.push({
        movie,
        votesCount: Math.round(count),
        voterNames: Array.from(voters),
        isVetoed,
        percentage,
      })
    }

    // Sort: Non-vetoed first, then highest votes, then highest TMDb rating
    results.sort((a, b) => {
      if (a.isVetoed !== b.isVetoed) return a.isVetoed ? 1 : -1
      if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount
      return (b.movie.vote_average || 0) - (a.movie.vote_average || 0)
    })

    return results
  } catch (err) {
    console.error('Error calculating group votes:', err)
    return []
  }
}
