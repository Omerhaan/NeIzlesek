import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Sparkles, Star, Film, X } from 'lucide-react'
import type { Movie } from '../types'
import { LOGO_BASE_URL } from '../services/tmdb'
import { MovieArtwork } from './MovieArtwork'

interface MatchModalProps {
  movie: Movie | null
  isOpen: boolean
  onClose: () => void
}

export function MatchModal({ movie, isOpen, onClose }: MatchModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti burst
      const duration = 2.5 * 1000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#e50914', '#10b981', '#f59e0b', '#3b82f6'],
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#e50914', '#10b981', '#f59e0b', '#3b82f6'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [isOpen])

  if (!isOpen || !movie) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Banner */}
        <div className="pt-6 pb-2 text-center z-10 px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            Eşleştiniz!
          </div>
          <h2 className="text-2xl font-black text-white">Bu Akşam Bunu İzliyorsunuz!</h2>
        </div>

        {/* Movie Poster & Details */}
        <div className="relative mx-6 my-2 h-72 rounded-2xl overflow-hidden shadow-lg border border-zinc-800">
          <MovieArtwork
            movie={movie}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          <div className="absolute bottom-3 left-3 right-3 text-left">
            <h3 className="text-lg font-bold text-white drop-shadow leading-tight">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3 h-3 fill-amber-400" />
                {movie.vote_average.toFixed(1)}
              </span>
              {movie.release_date && (
                <span className="text-zinc-400">
                  {movie.release_date.substring(0, 4)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Providers Section */}
        {movie.providers && movie.providers.length > 0 ? (
          <div className="px-6 py-2">
            <p className="text-xs font-semibold text-zinc-400 mb-2">Nerede İzlenir?</p>
            <div className="flex items-center gap-2 flex-wrap">
              {movie.providers.map((p) => (
                <div
                  key={p.provider_id}
                  className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg"
                >
                  <img
                    src={`${LOGO_BASE_URL}${p.logo_path}`}
                    alt={p.provider_name}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs text-zinc-200 font-medium">{p.provider_name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-2">
            <p className="text-xs text-zinc-500 italic">
              Türkiye için çevrim içi yayın bilgisi bulunamadı.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex flex-col gap-2.5">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(movie.title + ' filmi izle')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-transform active:scale-98"
          >
            <Film className="w-4 h-4" />
            Filmi Araştır / İzle
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            Seçmeye Devam Et
          </button>
        </div>
      </div>
    </div>
  )
}
