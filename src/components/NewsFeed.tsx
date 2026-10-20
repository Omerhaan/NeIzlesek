import { useState, useEffect } from 'react'
import { Sparkles, Calendar, Star, ExternalLink, Clapperboard } from 'lucide-react'
import { fetchNowPlayingMovies, fetchUpcomingMovies } from '../services/tmdb'
import type { Movie } from '../types'
import { MovieArtwork } from './MovieArtwork'

export function NewsFeed() {
  const [filter, setFilter] = useState<'now' | 'upcoming'>('now')
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([])
  const [upcoming, setUpcoming] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeed() {
      setLoading(true)
      const [nowList, upList] = await Promise.all([
        fetchNowPlayingMovies(),
        fetchUpcomingMovies(),
      ])
      setNowPlaying(nowList)
      setUpcoming(upList)
      setLoading(false)
    }
    loadFeed()
  }, [])

  const currentList = filter === 'now' ? nowPlaying : upcoming
  const heroMovie = currentList[0]

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-4 pt-2 pb-6 overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
            <Clapperboard className="w-3.5 h-3.5" />
            Sinema Dünyası
          </div>
          <h2 className="text-2xl font-black text-white">Film Haberleri & Vizyon</h2>
        </div>
      </div>

      {/* Tabs / Filter Chips */}
      <div className="flex items-center gap-2 mb-4 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setFilter('now')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'now'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Vizyondakiler
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filter === 'upcoming'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Yakında Gelecekler
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-400">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin mb-3" />
          <p className="text-xs">Vizyon haberleri alınıyor...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Featured Hero Card */}
          {heroMovie && (
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl">
              <div className="relative h-48 w-full">
                <MovieArtwork
                  movie={heroMovie}
                  preferBackdrop
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow">
                  Öne Çıkan
                </span>
              </div>
              <div className="p-4 -mt-6 relative z-10">
                <h3 className="text-lg font-black text-white leading-tight mb-1">
                  {heroMovie.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mb-2">
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {heroMovie.vote_average.toFixed(1)}
                  </span>
                  {heroMovie.release_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {heroMovie.release_date}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  {heroMovie.overview}
                </p>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(heroMovie.title + ' filmi vizyon haberleri')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300"
                >
                  Detayları Oku <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Feed List */}
          <div className="flex flex-col gap-3">
            {currentList.slice(1).map((movie) => (
              <div
                key={movie.id}
                className="flex gap-3 bg-zinc-900/90 border border-zinc-800/80 p-3 rounded-2xl hover:border-zinc-700 transition-colors"
              >
                <MovieArtwork
                  movie={movie}
                  className="w-16 h-24 rounded-xl object-cover shrink-0 border border-zinc-800"
                />
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight line-clamp-1">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1 mb-1.5">
                      <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {movie.vote_average.toFixed(1)}
                      </span>
                      {movie.release_date && (
                        <span>• {movie.release_date.substring(0, 4)}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {movie.overview}
                    </p>
                  </div>

                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + ' filmi')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white mt-1"
                  >
                    Haberleri İncele <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
