import { useState } from 'react'
import { Share2, Copy, Check, Users, Play, LogOut, Sparkles, QrCode } from 'lucide-react'
import type { Room, GroupParticipant } from '../types'
import { hapticLight, hapticLike } from '../utils/haptics'
import { RoomQRCodeModal } from './RoomQRCodeModal'

interface RoomWaitingLobbyProps {
  room: Room
  creatorName: string
  myUserId?: string
  isCreator?: boolean
  participants?: GroupParticipant[]
  onStartRoom?: () => void
  onStartSolo: () => void
  onLeaveRoom: () => void
}

export function RoomWaitingLobby({
  room,
  creatorName,
  isCreator = false,
  participants = [],
  onStartRoom,
  onStartSolo,
  onLeaveRoom,
}: RoomWaitingLobbyProps) {
  const [copied, setCopied] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const isGroup = room.room_mode === 'group'
  const maxSlots = room.max_participants || (isGroup ? 5 : 2)

  const handleCopyLink = () => {
    hapticLight()
    const url = `${window.location.origin}${window.location.pathname}?room=${room.room_code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    hapticLight()
    const url = `${window.location.origin}${window.location.pathname}?room=${room.room_code}`
    const text = encodeURIComponent(
      isGroup
        ? `🍿 Film Gecesi (Watch Party) Başlıyor! Oylamaya katılmak için tıkla: ${url}\nOda Kodu: ${room.room_code}`
        : `Bu akşam ne izlesek? Benimle film seçmek için tıkla: ${url}\nOda Kodu: ${room.room_code}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handleBypass = () => {
    hapticLike()
    onStartSolo()
  }

  const handleStartGroup = () => {
    hapticLike()
    onStartRoom?.()
  }

  // Parse registered partner names if presence list is smaller
  const partnerNamesList = room.partner_name
    ? room.partner_name.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const totalConnected = Math.max(
    participants.length,
    1 + partnerNamesList.length
  )

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center px-5 py-6 overflow-y-auto select-none animate-in fade-in duration-300">
      {/* Radar Pulse Icon & Status */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping opacity-60" />
          <div className="absolute -inset-3 rounded-full bg-rose-600/10 animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-2xl shadow-red-600/40 border border-red-400/30">
            <Users className="w-10 h-10" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>
            {isGroup
              ? `${totalConnected}/${maxSlots} Katılımcı Bağlandı`
              : 'Partner Bekleniyor'}
          </span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          {isGroup ? 'Arkadaş Grubu Hazırlanıyor!' : 'Oda Hazır, Sıra Partnerinde!'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
          {isGroup
            ? 'Arkadaşların odaya bağlandığında kurucu oylamayı başlatır. En çok oy alan film zirveye çıkar.'
            : 'Partnerin odaya katıldığı anda 25 film seçimi iki cihazda aynı anda başlayacaktır.'}
        </p>
      </div>

      {/* Room Code Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4 shadow-xl text-center">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
          {isGroup ? 'Grup Katılım Kodu' : 'Oda Katılım Kodu'}
        </span>
        <div className="py-2.5 px-4 bg-black/60 border border-zinc-800 rounded-2xl mb-3 flex items-center justify-center">
          <span className="text-3xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-amber-500">
            {room.room_code}
          </span>
        </div>

        {/* Share & QR Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              hapticLight()
              setIsQRModalOpen(true)
            }}
            className="py-3 px-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-amber-500/40 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>QR Kod</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-3 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-transform active:scale-98 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="py-3 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
          </button>
        </div>
      </div>

      {/* Participants Live Status */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 mb-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          <span>{isGroup ? 'Grup Koltukları' : 'Katılımcı Durumu'}</span>
          <span className="text-zinc-500 font-mono">
            {totalConnected}/{maxSlots}
          </span>
        </div>

        {/* 1. Kurucu Slot */}
        <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center text-xs font-black">
              👑
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">
                {room.creator_name || creatorName || 'Kurucu'}
              </div>
              <div className="text-[10px] text-zinc-500 font-medium">Oda Yöneticisi</div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Hazır
          </span>
        </div>

        {/* In Group Mode: Render other connected members and empty slots up to maxSlots */}
        {isGroup ? (
          <>
            {Array.from({ length: maxSlots - 1 }).map((_, index) => {
              const slotNum = index + 2
              // Check if a participant exists for this slot
              const partnerName = partnerNamesList[index]
              const participant = participants.find(
                (p) => p.username === partnerName || (index === 0 && p.username !== room.creator_name)
              )
              const isOccupied = Boolean(partnerName || participant)
              const displayName = participant?.username || partnerName

              if (isOccupied) {
                return (
                  <div
                    key={slotNum}
                    className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60 animate-in fade-in"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold">
                        {participant?.avatar || '🍿'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200 leading-tight">
                          {displayName || `Katılımcı #${slotNum}`}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium">Bağlandı</div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Hazır
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={slotNum}
                  className="flex items-center justify-between p-2 bg-zinc-950/30 rounded-xl border border-dashed border-zinc-800/60 opacity-60"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-600 border border-zinc-800 flex items-center justify-center text-xs">
                      💺
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-500 leading-tight">
                        Boş Koltuk #{slotNum}
                      </div>
                      <div className="text-[10px] text-zinc-600">Arkadaşını davet et</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded-full">
                    Bekleniyor
                  </span>
                </div>
              )
            })}
          </>
        ) : (
          /* Pair Mode Partner Slot */
          <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center justify-center text-xs font-bold">
                👥
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-300 leading-tight">
                  {room.partner_name || 'Partnerin'}
                </div>
                <div className="text-[10px] text-zinc-500 font-medium">
                  {room.partner_name ? 'Bağlandı' : 'Davet bekleniyor...'}
                </div>
              </div>
            </div>
            {room.partner_name ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hazır
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                Bağlantı Bekleniyor
              </span>
            )}
          </div>
        )}
      </div>

      {/* Group Creator CTA / Guest Waiting Banner */}
      {isGroup && (
        <div className="mb-4">
          {isCreator ? (
            <button
              type="button"
              onClick={handleStartGroup}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Grubu Başlat ({totalConnected} Kişi)</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs text-amber-300 font-medium">
                Kurucunun grubu başlatması bekleniyor...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Optional Bypass / Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBypass}
          className="flex-1 py-3 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          title="Kartları doğrudan başlat"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Beklemeden Başlat</span>
        </button>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="py-3 px-3 bg-zinc-950 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
          title="Odayı Kapat"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Odayı Kapat</span>
        </button>
      </div>

      {/* QR Code Modal */}
      <RoomQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        roomCode={room.room_code}
        roomMode={room.room_mode}
      />
    </div>
  )
}
