import { useState } from 'react'
import {
  Users,
  Share2,
  Copy,
  Check,
  LogOut,
  ArrowRight,
  Heart,
  Film,
} from 'lucide-react'
import { createRoom, getRoomByCode } from '../services/supabase'
import type { Room, Movie } from '../types'
import { IMAGE_BASE_URL } from '../services/tmdb'

interface UserProfileProps {
  userId: string
  activeRoom: Room | null
  onRoomCreatedOrJoined: (room: Room) => void
  onLeaveRoom: () => void
  onNavigateToMatch: () => void
  likedMovies?: Movie[]
}

export function UserProfile({
  userId,
  activeRoom,
  onRoomCreatedOrJoined,
  onLeaveRoom,
  onNavigateToMatch,
  likedMovies = [],
}: UserProfileProps) {
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCreateRoom = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const room = await createRoom()
      setCreatedRoom(room)
      onRoomCreatedOrJoined(room)
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
      onRoomCreatedOrJoined(room)
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

  const userShortId = userId.replace('usr_', '').substring(0, 6).toUpperCase()

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col px-4 pt-2 pb-6 overflow-y-auto">
      {/* Profile Header */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-3xl mb-5 shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md">
          🎬
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-zinc-400">Kullanıcı Hesabı</div>
          <h2 className="text-lg font-black text-white">Sinemasever #{userShortId}</h2>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Çevrim İçi
          </span>
        </div>
      </div>

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
            <span>Film Seçimine Git</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Room Management (Create or Join) */
        <div className="flex flex-col gap-3 mb-5">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
            Birlikte Film Seç
          </div>

          {/* Create Room Button / State */}
          {!createdRoom ? (
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl flex items-center justify-between px-5 shadow-xl shadow-red-600/25 transition-transform active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold">Yeni Oda Kur</div>
                  <div className="text-xs text-red-100 font-normal">Partnerini davet et, birlikte seç</div>
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
                Seçim Ekranına Git <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Liked Movies History */}
      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Beğendiğin Filmler ({likedMovies.length})
          </div>
        </div>

        {likedMovies.length === 0 ? (
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-center text-zinc-500 text-xs">
            <Film className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
            Henüz beğendiğiniz bir film yok. Orta sekmeden filmleri kaydırmaya başlayın!
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {likedMovies.map((movie) => (
              <div
                key={movie.id}
                className="relative rounded-xl overflow-hidden aspect-[2/3] border border-zinc-800 group shadow"
              >
                <img
                  src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white line-clamp-1 leading-tight">
                  {movie.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
