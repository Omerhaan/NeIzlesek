import { useState } from 'react'
import { Users, User, ArrowRight, Share2, Copy, Check, Sparkles } from 'lucide-react'
import { createRoom, getRoomByCode } from '../services/supabase'
import { GENRES } from '../services/tmdb'
import type { Room } from '../types'

interface RoomLobbyProps {
  onJoinRoom: (room: Room) => void
  onStartSolo: (genreId: number) => void
  selectedGenre: number
  onSelectGenre: (genreId: number) => void
}

export function RoomLobby({
  onJoinRoom,
  onStartSolo,
  selectedGenre,
  onSelectGenre,
}: RoomLobbyProps) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
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
      setMode('create')
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
        setErrorMsg('Oda bulunamadı! Kodu kontrol edin.')
        return
      }
      onJoinRoom(room)
    } catch (err: any) {
      setErrorMsg('Odaya bağlanırken hata oluştu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!createdRoom) return
    const url = `${window.location.origin}?room=${createdRoom.room_code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    if (!createdRoom) return
    const url = `${window.location.origin}?room=${createdRoom.room_code}`
    const text = encodeURIComponent(
      `Bu akşam ne izlesek? Benimle film seçmek için tıkla: ${url}\nOda Kodu: ${createdRoom.room_code}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center px-6 py-8 overflow-y-auto">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Kararsızlığa Son
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Bu Akşam <span className="bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent">Ne İzlesek?</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
          Partneriniz veya arkadaşınızla eşleşin, ikinizin de beğendiği ortak filmi anında bulun!
        </p>
      </div>

      {/* Genre Filter Pills */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-zinc-400 block mb-2 text-left">
          Film Türü Seçin
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelectGenre(g.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                selectedGenre === g.id
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* Home Selection Mode */}
      {mode === 'home' && (
        <div className="flex flex-col gap-3">
          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-red-600/25 transition-transform active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-bold">Oda Kur (Birlikte Seç)</div>
                <div className="text-xs text-red-100 font-normal">Partnerini davet et, eşleş</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/80" />
          </button>

          {/* Join Room Button */}
          <button
            onClick={() => setMode('join')}
            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-white font-bold rounded-2xl flex items-center justify-between px-6 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <div className="text-base font-bold">Odaya Katıl</div>
                <div className="text-xs text-zinc-400 font-normal">6 haneli oda kodu ile bağlan</div>
              </div>
            </div>
            <span className="text-xs text-zinc-500 font-mono">KOD GİR</span>
          </button>

          {/* Solo Mode Button */}
          <button
            onClick={() => onStartSolo(selectedGenre)}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
          >
            <User className="w-4 h-4 text-zinc-400" />
            Tek Başıma Keşfetmek İstiyorum
          </button>
        </div>
      )}

      {/* Room Created Modal Screen */}
      {mode === 'create' && createdRoom && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Odanız Hazır!
          </p>
          <h3 className="text-xl font-bold text-white mb-4">Partnerini Odaya Çağır</h3>

          <div className="my-4 p-4 bg-black/50 border border-zinc-700 rounded-2xl">
            <span className="text-xs text-zinc-400 block mb-1">Oda Kodu</span>
            <span className="text-3xl font-black font-mono tracking-widest text-amber-400">
              {createdRoom.room_code}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 my-4">
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp ile Paylaş
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Bağlantı Kopyalandı!' : 'Davet Linkini Kopyala'}
            </button>
          </div>

          <button
            onClick={() => onJoinRoom(createdRoom)}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer mt-2"
          >
            Seçmeye Başla
          </button>
        </div>
      )}

      {/* Join Room Form */}
      {mode === 'join' && (
        <form
          onSubmit={handleJoinSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center animate-in fade-in zoom-in-95 duration-200"
        >
          <h3 className="text-xl font-bold text-white mb-2">Odaya Katıl</h3>
          <p className="text-xs text-zinc-400 mb-6">
            Partnerinizin gönderdiği 6 haneli kodu girin:
          </p>

          <input
            type="text"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Örn: 4K9M2L"
            className="w-full text-center text-3xl font-mono font-black tracking-widest py-3 px-4 bg-black/60 border border-zinc-700 focus:border-red-500 rounded-xl text-white outline-none mb-4 uppercase"
            autoFocus
          />

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || joinCode.length < 4}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-transform active:scale-98 cursor-pointer"
            >
              {loading ? 'Bağlanıyor...' : 'Odaya Gir'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('home')
                setErrorMsg('')
              }}
              className="w-full py-2.5 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              Geri Dön
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
