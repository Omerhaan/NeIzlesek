import { useState } from 'react'
import {
  Sparkles,
  ArrowRight,
  Heart,
  X,
  Eye,
  Check,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import type { Movie, SwipeAction } from '../types'
import {
  type TasteProfile,
  AVATARS,
  COLD_START_MOVIES,
  updateTasteWithSwipe,
  saveTasteProfile,
  getTopGenresWithPercentages,
} from '../services/tasteProfile'
import { SwipeDeck } from './SwipeDeck'

interface OnboardingFlowProps {
  initialProfile: TasteProfile
  onComplete: (completedProfile: TasteProfile) => void
}

export function OnboardingFlow({ initialProfile, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<'profile' | 'tutorial' | 'coldstart' | 'result'>('profile')
  const [profile, setProfile] = useState<TasteProfile>(initialProfile)
  const [usernameInput, setUsernameInput] = useState(initialProfile.username || '')
  const [selectedAvatar, setSelectedAvatar] = useState(initialProfile.avatar || '🍿')

  // Step 1: Save basic profile
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = usernameInput.trim() || 'Sinemasever'
    const updated = {
      ...profile,
      username: trimmed,
      avatar: selectedAvatar,
    }
    setProfile(updated)
    saveTasteProfile(updated)
    setStep('tutorial')
  }

  // Step 3: Swipe in Cold Start
  const handleColdStartSwipe = (movie: Movie, action: SwipeAction) => {
    const updated = updateTasteWithSwipe(profile, movie, action)
    setProfile(updated)
  }

  // When all 30 movies are swiped
  const handleColdStartFinished = () => {
    const finalized: TasteProfile = {
      ...profile,
      isOnboarded: true,
    }
    setProfile(finalized)
    saveTasteProfile(finalized)

    // Trigger celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    })

    setStep('result')
  }

  const topGenres = getTopGenresWithPercentages(profile, 4)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950 text-white select-none">
      {/* Step 1: User Profile / Nickname Setup */}
      {step === 'profile' && (
        <form
          onSubmit={handleProfileSubmit}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 mx-auto flex items-center justify-center text-3xl shadow-lg mb-4">
            {selectedAvatar}
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Neİzlesek'e Hoş Geldin!</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Önce profilini oluşturalım. İsmin veya rumuzun ne olsun?
          </p>

          {/* Avatar selector */}
          <div className="mb-4">
            <span className="text-[11px] font-semibold text-zinc-400 block text-left mb-2">
              Profil İkonu Seç
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform cursor-pointer border ${
                    selectedAvatar === av
                      ? 'bg-zinc-800 border-red-500 scale-110 shadow-md ring-2 ring-red-500/50'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Username Input */}
          <div className="mb-6 text-left">
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
              İsminiz / Kullanıcı Adınız
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Örn: Barış, Ece, Sinemasever"
              className="w-full py-3 px-4 bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl text-white outline-none text-sm font-semibold"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Devam Et</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Step 2: How It Works / Tutorial */}
      {step === 'tutorial' && (
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Nasıl Kullanılır?
          </div>
          <h2 className="text-xl font-black text-white mb-6">Kartları Kaydırarak Seç</h2>

          <div className="flex flex-col gap-3.5 mb-8 text-left">
            {/* Like hint */}
            <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-emerald-500/30 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 fill-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sağa Kaydır → BEĞEN</h4>
                <p className="text-[11px] text-zinc-400">İzlemek istediğin filmleri sağa kaydır. Zevk puanın artar.</p>
              </div>
            </div>

            {/* Pass hint */}
            <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-rose-500/30 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center shrink-0">
                <X className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sola Kaydır ← PAS</h4>
                <p className="text-[11px] text-zinc-400">İlgini çekmeyen filmleri sola kaydır. Algoritma bir daha önermez.</p>
              </div>
            </div>

            {/* Watched hint */}
            <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-purple-500/30 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Aşağı Ok / Orta Buton: İZLEDİM</h4>
                <p className="text-[11px] text-zinc-400">Zaten izlediğin filmleri işaretle, zevkine katkı sağlar.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('coldstart')}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>30 Film Testine Başla</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 3: Cold Start 30 Movie Deck */}
      {step === 'coldstart' && (
        <div className="w-full h-full max-w-md mx-auto flex flex-col justify-between py-3">
          <div className="text-center px-4 py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              Zevk Algoritması Oluşturuluyor
            </span>
            <h3 className="text-sm font-bold text-zinc-300">
              Aşağıdaki filmleri inceleyin (30 Film)
            </h3>
          </div>

          <SwipeDeck
            movies={COLD_START_MOVIES}
            onSwipe={handleColdStartSwipe}
            onLoadNextRound={handleColdStartFinished}
            isLoading={false}
            roundNumber={1}
            roundLimit={30}
          />
        </div>
      )}

      {/* Step 4: Result & Profile Reveal */}
      {step === 'result' && (
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Zevk Profilin Hazır!</h2>
          <p className="text-xs text-zinc-400 mb-6">
            Tebrikler {profile.username}! Seçtiğin 30 film üzerinden film zevk haritan çıkarıldı:
          </p>

          {/* Top Genres Breakdown */}
          <div className="flex flex-col gap-2.5 mb-6 text-left">
            {topGenres.length > 0 ? (
              topGenres.map((g) => (
                <div key={g.genreId} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                  <div className="flex justify-between text-xs font-bold text-white mb-1">
                    <span>{g.name}</span>
                    <span className="text-amber-400 font-mono">%{g.percentage}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                      style={{ width: `${g.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-zinc-950 rounded-xl text-center text-xs text-zinc-400">
                Tüm türlerden dengeli bir zevkiniz var!
              </div>
            )}
          </div>

          <button
            onClick={() => onComplete(profile)}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Filmleri Keşfetmeye Başla</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
