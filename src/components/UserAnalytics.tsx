import { Clock, TrendingUp, Star, Heart, Eye, Film, Sparkles } from 'lucide-react'
import type { TasteProfile } from '../services/tasteProfile'
import {
  calculateLifeCounter,
  calculateProfileStats,
  getTopGenresWithPercentages,
  calculateCoupleCompatibility,
} from '../services/tasteProfile'

interface UserAnalyticsProps {
  tasteProfile: TasteProfile
  partnerScores?: Record<number, number>
  partnerName?: string
}

const GENRE_COLORS = [
  'from-red-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-sky-500 to-blue-500',
]

export function UserAnalytics({
  tasteProfile,
  partnerScores,
  partnerName,
}: UserAnalyticsProps) {
  const stats = calculateProfileStats(tasteProfile)
  const lifeCounter = calculateLifeCounter(tasteProfile.watchedMovies)
  const topGenres = getTopGenresWithPercentages(tasteProfile, 5)
  const compatibilityScore = calculateCoupleCompatibility(
    tasteProfile.genreScores,
    partnerScores
  )
  const matchCount = (tasteProfile.matchHistory || []).length

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* 1. Hayat Sayacı (Life Counter Card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-amber-500/20 p-5 shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Sinemaya Ayrılan Ömür</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </h3>
            <span className="text-[11px] text-zinc-400">İzlenen filmlerin toplam süresi</span>
          </div>
        </div>

        {stats.watchedCount > 0 ? (
          <div>
            <div className="flex items-baseline gap-2 mb-1.5">
              {lifeCounter.days > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                    {lifeCounter.days}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">gün</span>
                </div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white font-mono tracking-tight">
                  {lifeCounter.hours}
                </span>
                <span className="text-xs font-semibold text-zinc-400">saat</span>
              </div>
              {lifeCounter.days === 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-300 font-mono tracking-tight">
                    {lifeCounter.minutes}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">dakika</span>
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bugüne kadar <strong className="text-white">{stats.watchedCount}</strong> film ile toplam{' '}
              <strong className="text-amber-300 font-mono">
                {lifeCounter.totalMinutes.toLocaleString('tr-TR')}
              </strong>{' '}
              dakika sinema deneyimi yaşadın.
            </p>
          </div>
        ) : (
          <div className="py-2 text-xs text-zinc-400">
            Henüz izlenen film eklenmedi. Keşfederken filmleri{' '}
            <strong className="text-emerald-400 font-medium">👁️ 'İzledim'</strong> olarak işaretlediğinde
            burada sinema sayacın hesaplanacak.
          </div>
        )}
      </div>

      {/* 2. Hızlı Metrikler (Quick Stats Grid) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Beğeni Oranı */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span className="font-medium">Beğeni Oranı</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              %{stats.likeRatio}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {stats.likedCount} beğeni / {stats.totalSwipes} kart
            </div>
          </div>
        </div>

        {/* Ortalama Puan */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span className="font-medium">Ortalama Puan</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {stats.averageRating !== null ? `${stats.averageRating}` : '—'}
              {stats.averageRating !== null && (
                <span className="text-xs text-zinc-500 font-normal"> / 10</span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {stats.totalRatedCount > 0 ? `${stats.totalRatedCount} film puanlandı` : 'Henüz puan verilmedi'}
            </div>
          </div>
        </div>

        {/* İzlenen Film */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span className="font-medium">İzlenen Filmler</span>
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              {stats.watchedCount}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Arşivlenen filmler</div>
          </div>
        </div>

        {/* İzlemek İstediklerim */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span className="font-medium">İzleme Listesi</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              {stats.likedCount}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Sırada bekleyenler</div>
          </div>
        </div>
      </div>

      {/* 3. Çift Uyumu Kartı */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-purple-950/40 border border-rose-500/20 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30 text-xl">
            💑
          </div>
          <div>
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1">
              <span>{partnerName ? `${partnerName} ile Uyum` : 'Partner Zevk Uyumu'}</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              {matchCount > 0
                ? `${matchCount} ortak film eşleşmesi kaydedildi`
                : compatibilityScore !== null
                ? 'Tür tercihleri ve seçimler üzerinden hesaplandı'
                : partnerName
                ? 'Partner zevk verisi eşitleniyor ⏳'
                : 'Bir odaya katıldığında canlı hesaplanır'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-rose-400 font-mono">
            {compatibilityScore !== null ? `%${compatibilityScore}` : '%—'}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-rose-300/80 font-bold">
            {compatibilityScore !== null ? 'Uyum Skoru' : 'Bekleniyor'}
          </div>
        </div>
      </div>

      {/* 4. Tür Afinitesi & Zevk Dağılımı */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              En Sevdiğin Film Türleri
            </h4>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Tür Ağırlığı</span>
        </div>

        {topGenres.length > 0 ? (
          <div className="flex flex-col gap-3">
            {topGenres.map((genre, idx) => (
              <div key={genre.genreId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{genre.name}</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    %{genre.percentage}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      GENRE_COLORS[idx % GENRE_COLORS.length]
                    } transition-all duration-500`}
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-zinc-500">
            Tür skorlarını oluşturmak için film keşfetmeye başla!
          </div>
        )}
      </div>
    </div>
  )
}
