const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY?.trim() ?? ''

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const appConfigIssues = [
  ...(isHttpUrl(supabaseUrl) ? [] : ['VITE_SUPABASE_URL geçerli bir http/https adresi olmalı.']),
  ...(supabaseAnonKey ? [] : ['VITE_SUPABASE_ANON_KEY eksik.']),
  ...(tmdbApiKey ? [] : ['VITE_TMDB_API_KEY eksik.']),
]

export const supabaseClientConfig = {
  url: isHttpUrl(supabaseUrl) ? supabaseUrl : 'http://127.0.0.1:54321',
  anonKey: supabaseAnonKey || 'missing-supabase-anon-key',
}
