import { useState } from 'react'
import {
  Users,
  Share2,
  Copy,
  Check,
  LogOut,
  ArrowRight,
  Heart,
  Eye,
  Star,
  Search,
  Trash2,
  Film,
  BarChart2,
  Trophy,
  Cloud,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { createRoom, getRoomByCode } from '../services/supabase'
import type { Room, Movie, RoomMode } from '../types'
import { MovieArtwork } from './MovieArtwork'
import { PrivacyPolicyModal } from './PrivacyPolicyModal'
import {
  removeLikedMovie,
  markMovieAsWatched,
  removeWatchedMovie,
  moveWatchedToLiked,
  updateMovieRating,
  type TasteProfile,
} from '../services/tasteProfile'
import { MovieDetailModal } from './MovieDetailModal'
import { UserAnalytics } from './UserAnalytics'
import { MatchArchive } from './MatchArchive'

interface UserProfileProps {
  tasteProfile: TasteProfile
  activeRoom: Room | null
  partnerScores?: Record<number, number>
  authUser?: any
  onCreateRoom?: (mode?: RoomMode) => Promise<Room>
  onRoomCreatedOrJoined: (room: Room, isCreator?: boolean) => Promise<void> | void
  onLeaveRoom: () => void
  onNavigateToMatch: () => void
  onUpdateTasteProfile?: (profile: TasteProfile) => void
  onStartCalibration?: () => void
  onOpenAuthModal?: () => void
  onSignOut?: () => void
}

export function UserProfile({
  tasteProfile,
  activeRoom,
  partnerScores,
  authUser,
  onCreateRoom,
  onRoomCreatedOrJoined,
  onLeaveRoom,
  onNavigateToMatch,
  onUpdateTasteProfile,
  onStartCalibration,
  onOpenAuthModal,
  onSignOut,
}: UserProfileProps) {
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null)
  const [selectedMode, setSelectedMode] = useState<RoomMode>('pair')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)

  // Main Section switcher: 'watchlist' | 'analytics' | 'archive'
  const [activeSectionTab, setActiveSectionTab] = useState<'watchlist' | 'analytics' | 'archive'>('watchlist')

  // Watchlist tabs & search
  const [activeListTab, setActiveListTab] = useState<'liked' | 'watched'>('liked')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState<{
    movie: Movie
    listType: 'liked' | 'watched'
    rating?: number
  } | null>(null)

  const handleCreateRoom = async (mode: RoomMode = selectedMode) => {
    setLoading(true)
    setErrorMsg('')
    try {
      let room: Room
      if (onCreateRoom) {
        room = await onCreateRoom(mode)
      } else {
        room = await createRoom(
          tasteProfile.username || 'Kurucu',
          undefined,
          mode,
          mode === 'group' ? 5 : 2
        )
        sessionStorage.setItem('neizlesek_created_room_code', room.room_code)
      }
      await onRoomCreatedOrJoined(room, true)
      setCreatedRoom(room)
      onNavigateToMatch()
    } catch (err: any) {
      setErrorMsg('Oda oluşturulamadı: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setLoading(true)
    setErrorMsg('')
    try {
      const room = await getRoomByCode(joinCode.trim())
      if (!room) {
        setErrorMsg('Oda bulunamadı! Lütfen kodu kontrol edin.')
        return
      }
      await onRoomCreatedOrJoined(room, false)
      onNavigateToMatch()
    } catch (err: any) {
      setErrorMsg('Odaya bağlanırken hata oluştu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}?room=${code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = (code: string) => {
    const url = `${window.location.origin}?room=${code}`
    const text = encodeURIComponent(
      `Bu akşam ne izlesek? Benimle film seçmek için tıkla: ${url}\nOda Kodu: ${code}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  // Movie actions
  const handleMarkAsWatched = (movie: Movie, rating?: number) => {
    const updated = markMovieAsWatched(tasteProfile, movie, rating)
    onUpdateTasteProfile?.(updated)
  }

  const handleRemoveLiked = (movieId: number) => {
    const updated = removeLikedMovie(tasteProfile, movieId)
    onUpdateTasteProfile?.(updated)
  }

  const handleUpdateRating = (movieId: number, rating: number) => {
    const updated = updateMovieRating(tasteProfile, movieId, rating)
    onUpdateTasteProfile?.(updated)
  }

  const handleMoveToLiked = (movie: Movie) => {
    const updated = moveWatchedToLiked(tasteProfile, movie)
    onUpdateTasteProfile?.(updated)
  }

  const handleRemoveWatched = (movieId: number) => {
    const updated = removeWatchedMovie(tasteProfile, movieId)
    onUpdateTasteProfile?.(updated)
  }

  const likedMovies = tasteProfile.likedMovies || []
  const watchedMovies = tasteProfile.watchedMovies || []

  // Filter based on search query
  const query = searchQuery.trim().toLowerCase()
  const filteredLiked = likedMovies.filter((m) =>
    query ? m.title.toLowerCase().includes(query) || m.original_title?.toLowerCase().includes(query) : true
  )
  const filteredWatched = watchedMovies.filter((w) =>
    query
      ? w.movie.title.toLowerCase().includes(query) ||
        w.movie.original_title?.toLowerCase().includes(query)
      : true
  )

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-4 pt-2 pb-6 overflow-y-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-3.5 bg-zinc-900 border border-zinc-800 p-4 rounded-3xl mb-5 shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-3xl shadow-md">
          {tasteProfile.avatar || '🍿'}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-zinc-400">Kullanıcı Profili</div>
          <h2 className="text-lg font-black text-white">{tasteProfile.username}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Aktif Üye
            </span>
            <span className="text-[11px] text-zinc-500">• {tasteProfile.totalSwipes} Film İncelendi</span>
          </div>
        </div>
      </div>

      {/* Cloud Account Status / Action */}
      {authUser ? (
        <div className="flex items-center justify-between px-4 py-2.5 bg-sky-950/40 border border-sky-500/30 rounded-2xl mb-4 text-xs shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-sky-300 font-semibold truncate">{authUser.email}</span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
              Yedeklendi
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="text-zinc-400 hover:text-rose-400 text-xs font-semibold cursor-pointer shrink-0 ml-2"
          >
            Çıkış Yap
          </button>
        </div>
      ) : (
        <div
          onClick={onOpenAuthModal}
          className="flex items-center justify-between p-3.5 bg-gradient-to-r from-sky-950/40 via-zinc-900 to-blue-950/40 border border-sky-500/25 rounded-2xl mb-4 cursor-pointer hover:border-sky-500/50 transition-all shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                İlerlemeyi Buluta Kaydet
              </h4>
              <p className="text-[10px] text-zinc-400">
                Cihaz değiştirirken listelerin ve analitiğin kaybolmasın
              </p>
            </div>
          </div>
          <span className="text-[11px] text-sky-400 font-bold px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 shrink-0">
            Giriş / Kayıt
          </span>
        </div>
      )}

      {/* 30 Movie Calibration Card (if skipped) */}
      {tasteProfile.coldStartCompleted !== true && (
        <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-amber-950/30 border border-amber-500/25 rounded-2xl mb-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Zevk Kalibrasyonu (30 Film)</h4>
              <p className="text-[10px] text-zinc-400">
                Sana özel öneriler için testi istediğin zaman çözebilirsin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStartCalibration}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shrink-0 cursor-pointer shadow-md shadow-amber-500/20 transition-transform active:scale-95"
          >
            Testi Çöz
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* Active Room Status */}
      {activeRoom ? (
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-5 mb-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Aktif Eşleşme Odası
            </span>
            <button
              onClick={onLeaveRoom}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Ayrıl
            </button>
          </div>

          <div className="p-3 bg-black/50 border border-zinc-800 rounded-2xl flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">Oda Kodu</span>
              <span className="text-2xl font-black font-mono tracking-widest text-amber-400">
                {activeRoom.room_code}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopyLink(activeRoom.room_code)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors cursor-pointer"
                title="Kopyala"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleShareWhatsApp(activeRoom.room_code)}
                className="p-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl transition-colors cursor-pointer"
                title="WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={onNavigateToMatch}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <span>Film Seçimine Git (25 Film)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Room Management (Create or Join) */
        <div className="flex flex-col gap-3 mb-5">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
            Birlikte Film Seç (25 Özel Film)
          </div>

          {/* Mode Selector Segmented Control */}
          {!createdRoom && (
            <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedMode('pair')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'pair'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>İkili Çift (2 Kişi)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('group')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'group'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Arkadaş Grubu (3-5)</span>
              </button>
            </div>
          )}

          {/* Create Room Button / State */}
          {!createdRoom ? (
            <button
              onClick={() => handleCreateRoom(selectedMode)}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-75 text-white font-bold rounded-2xl flex items-center justify-between px-5 shadow-xl shadow-red-600/25 transition-transform active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className={`w-5 h-5 text-white ${loading ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <div className="text-sm font-bold">
                    {loading
                      ? '25 Özel Film Hazırlanıyor...'
                      : selectedMode === 'group'
                      ? 'Watch Party Grubu Kur'
                      : 'Yeni Oda Kur'}
                  </div>
                  <div className="text-xs text-red-100 font-normal">
                    {loading
                      ? 'Kriterlerinize uygun deste oluşturuluyor'
                      : selectedMode === 'group'
                      ? '3-5 arkadaşınla oy çokluğu ile seç'
                      : 'Ortak zevkinize göre 25 film hazırla'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80" />
            </button>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 text-center">
              <span className="text-xs text-zinc-400 block mb-1">Oluşturulan Oda Kodu</span>
              <span className="text-2xl font-black font-mono tracking-widest text-amber-400 block mb-3">
                {createdRoom.room_code}
              </span>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleShareWhatsApp(createdRoom.room_code)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  onClick={() => handleCopyLink(createdRoom.room_code)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Kopyala
                </button>
              </div>
              <button
                onClick={onNavigateToMatch}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Seçim Ekranına Git (25 Film) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Join Room Form */}
          <form
            onSubmit={handleJoinSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3"
          >
            <div className="text-left">
              <div className="text-sm font-bold text-white">Mevcut Odaya Katıl</div>
              <div className="text-xs text-zinc-400">Partnerinin paylaştığı 6 haneli kodu gir</div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Örn: 9KM4Q2"
                className="flex-1 text-center font-mono font-bold tracking-widest py-2.5 px-3 bg-black/60 border border-zinc-700 focus:border-red-500 rounded-xl text-white outline-none uppercase text-sm"
              />
              <button
                type="submit"
                disabled={loading || joinCode.length < 4}
                className="px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Katıl
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Section Tabs (Watchlist / Analytics / Match Archive) */}
      <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4">
        <button
          type="button"
          onClick={() => setActiveSectionTab('watchlist')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSectionTab === 'watchlist'
              ? 'bg-zinc-800 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Listelerim</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/40 text-zinc-400">
            {likedMovies.length + watchedMovies.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSectionTab('analytics')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSectionTab === 'analytics'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Analitik</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSectionTab('archive')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSectionTab === 'archive'
              ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md shadow-rose-600/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Eşleşmeler</span>
          {(tasteProfile.matchHistory || []).length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/40 text-white">
              {(tasteProfile.matchHistory || []).length}
            </span>
          )}
        </button>
      </div>

      {activeSectionTab === 'analytics' && (
        <UserAnalytics
          tasteProfile={tasteProfile}
          partnerScores={partnerScores}
          partnerName={activeRoom?.partner_name || undefined}
        />
      )}

      {activeSectionTab === 'archive' && (
        <MatchArchive
          tasteProfile={tasteProfile}
          onUpdateTasteProfile={onUpdateTasteProfile}
          onSelectMovieForDetail={(movie) =>
            setSelectedMovieForDetail({
              movie,
              listType: 'liked',
            })
          }
        />
      )}

      {/* Watchlist Management Section */}
      {activeSectionTab === 'watchlist' && (
      <div className="flex flex-col gap-3 flex-1">
        {/* Watchlist Tab Switcher */}
        <div className="flex p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveListTab('liked')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeListTab === 'liked'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeListTab === 'liked' ? 'fill-white' : ''}`} />
            <span>İzlemek İstediklerim</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeListTab === 'liked' ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {likedMovies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveListTab('watched')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeListTab === 'watched'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>İzlediklerim</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeListTab === 'watched' ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {watchedMovies.length}
            </span>
          </button>
        </div>

        {/* Quick Search in List */}
        {(likedMovies.length > 3 || watchedMovies.length > 3) && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${activeListTab === 'liked' ? 'İzlemek istediklerinde' : 'İzlediklerinde'} ara...`}
              className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        )}

        {/* Liked Movies Grid */}
        {activeListTab === 'liked' && (
          <div>
            {likedMovies.length === 0 ? (
              <div className="p-8 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-center text-zinc-500 text-xs">
                <Heart className="w-8 h-8 mx-auto mb-2 text-zinc-600 stroke-1" />
                <p className="font-semibold text-zinc-400 mb-1">İzleme listeniz henüz boş</p>
                <p>Orta sekmeden filmleri sağa kaydırarak listenize ekleyebilirsiniz.</p>
              </div>
            ) : filteredLiked.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs">
                Aramanızla eşleşen film bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredLiked.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() =>
                      setSelectedMovieForDetail({
                        movie,
                        listType: 'liked',
                      })
                    }
                    className="relative rounded-xl overflow-hidden aspect-[2/3] border border-zinc-800/80 group shadow-md cursor-pointer hover:border-zinc-600 transition-all active:scale-98"
                  >
                    <MovieArtwork
                      movie={movie}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                    {/* TMDb Rating Badge */}
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/10">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {movie.vote_average.toFixed(1)}
                    </span>

                    {/* Quick Delete Hover Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveLiked(movie.id)
                      }}
                      title="Listeden Çıkar"
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/10 opacity-80 md:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white line-clamp-1 leading-tight">
                      {movie.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Watched Movies Grid */}
        {activeListTab === 'watched' && (
          <div>
            {watchedMovies.length === 0 ? (
              <div className="p-8 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-center text-zinc-500 text-xs">
                <Eye className="w-8 h-8 mx-auto mb-2 text-zinc-600 stroke-1" />
                <p className="font-semibold text-zinc-400 mb-1">Henüz izlenen film eklenmedi</p>
                <p>
                  Keşfederken 👁️ 'İzledim' butonuna basarak veya beğendiğiniz filmlerden buraya aktararak
                  puanlayabilirsiniz.
                </p>
              </div>
            ) : filteredWatched.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs">
                Aramanızla eşleşen film bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredWatched.map(({ movie, rating }) => (
                  <div
                    key={movie.id}
                    onClick={() =>
                      setSelectedMovieForDetail({
                        movie,
                        listType: 'watched',
                        rating,
                      })
                    }
                    className="relative rounded-xl overflow-hidden aspect-[2/3] border border-zinc-800/80 group shadow-md cursor-pointer hover:border-zinc-600 transition-all active:scale-98"
                  >
                    <MovieArtwork
                      movie={movie}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                    {/* User Rating Badge or Watched Badge */}
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-[9px] font-bold text-amber-300 bg-amber-950/80 border border-amber-600/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                      {rating !== undefined ? (
                        <>
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{rating}/10</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">İzlendi</span>
                        </>
                      )}
                    </span>

                    {/* Quick Delete Hover Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveWatched(movie.id)
                      }}
                      title="İzlenenlerden Çıkar"
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/10 opacity-80 md:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white line-clamp-1 leading-tight">
                      {movie.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Footer & Legal Attribution */}
      <div className="mt-8 mb-4 pt-4 border-t border-zinc-800/60 text-center flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setIsPrivacyModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          <span>Gizlilik Politikası & Yasal Bilgilendirme</span>
        </button>
        <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed">
          Bu uygulama film verileri için The Movie Database (TMDb) ve JustWatch API&apos;lerini kullanmaktadır.
        </p>
      </div>

      {/* Privacy Policy & Terms Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Movie Action & Detail Modal */}
      <MovieDetailModal
        movie={selectedMovieForDetail?.movie || null}
        listType={selectedMovieForDetail?.listType || 'liked'}
        initialRating={selectedMovieForDetail?.rating}
        isOpen={!!selectedMovieForDetail}
        onClose={() => setSelectedMovieForDetail(null)}
        onMarkAsWatched={handleMarkAsWatched}
        onRemoveLiked={handleRemoveLiked}
        onUpdateRating={handleUpdateRating}
        onMoveToLiked={handleMoveToLiked}
        onRemoveWatched={handleRemoveWatched}
      />
    </div>
  )
}
