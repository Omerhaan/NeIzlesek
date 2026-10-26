import type { Movie, WatchedMovieEntry } from '../types'
import type { TasteProfile } from '../services/tasteProfile'

// Helper to escape CSV cell content
function escapeCSV(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '""'
  const str = String(text).replace(/"/g, '""')
  return `"${str}"`
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export watched movies to Letterboxd & Excel compatible CSV with UTF-8 BOM
export function exportWatchedMoviesCSV(watchedEntries: WatchedMovieEntry[]): void {
  if (!watchedEntries || watchedEntries.length === 0) return

  const header = ['Title', 'Year', 'Rating10', 'WatchedDate', 'TMDbID']
  const rows = watchedEntries.map((w) => {
    const movie = w.movie
    const year = (movie.release_date || '').substring(0, 4)
    const rating = w.rating || ''
    const date = (w.watchedAt || '').substring(0, 10)
    return [
      escapeCSV(movie.title),
      escapeCSV(year),
      escapeCSV(rating),
      escapeCSV(date),
      escapeCSV(movie.id),
    ].join(',')
  })

  // \uFEFF ensures Turkish characters render properly in Microsoft Excel
  const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `neizlesek-izlediklerim-${new Date().toISOString().substring(0, 10)}.csv`)
}

// Export liked watchlist to CSV
export function exportLikedMoviesCSV(likedMovies: Movie[]): void {
  if (!likedMovies || likedMovies.length === 0) return

  const header = ['Title', 'Year', 'Rating', 'TMDbID']
  const rows = likedMovies.map((m) => {
    const year = (m.release_date || '').substring(0, 4)
    return [
      escapeCSV(m.title),
      escapeCSV(year),
      escapeCSV(m.vote_average),
      escapeCSV(m.id),
    ].join(',')
  })

  const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `neizlesek-izlemek-istediklerim-${new Date().toISOString().substring(0, 10)}.csv`)
}

// Export complete profile backup as JSON
export function exportProfileBackupJSON(profile: TasteProfile): void {
  const jsonContent = JSON.stringify(profile, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  triggerDownload(blob, `neizlesek-yedek-${new Date().toISOString().substring(0, 10)}.json`)
}
