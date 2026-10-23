import { useState } from 'react'
import { Cloud, Lock, Mail, User, X, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '../services/supabase'
import type { TasteProfile } from '../services/tasteProfile'
import { hapticLike, hapticLight } from '../utils/haptics'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  currentProfile: TasteProfile
  onAuthSuccess: (user: any, restoredProfile?: TasteProfile) => void
}

export function AuthModal({
  isOpen,
  onClose,
  currentProfile,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(currentProfile.username || '')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              username: username.trim() || currentProfile.username || 'Sinemasever',
              avatar: currentProfile.avatar,
              taste_profile: currentProfile,
            },
          },
        })

        if (error) throw error

        if (data.session && data.user) {
          hapticLike()
          setSuccessMsg('Hesabınız başarıyla oluşturuldu ve verileriniz buluta yedeklendi! 🎉')
          setTimeout(() => {
            onAuthSuccess(data.user)
            onClose()
          }, 1200)
        } else {
          // Email confirmation is required by Supabase project settings
          hapticLight()
          setSuccessMsg(
            'Kayıt başarılı! E-posta adresinize bir onay linki gönderildi. Onayladıktan sonra giriş yapabilirsiniz.'
          )
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        })

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('E-posta adresiniz henüz onaylanmamış. Lütfen gelen kutunuzu kontrol edin.')
          }
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-posta adresi veya şifre hatalı.')
          }
          throw error
        }

        if (data.user) {
          hapticLike()
          const cloudProfile = data.user.user_metadata?.taste_profile as TasteProfile | undefined
          setSuccessMsg('Giriş başarılı! Verileriniz senkronize edildi. 🎉')
          setTimeout(() => {
            onAuthSuccess(data.user, cloudProfile)
            onClose()
          }, 1000)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mb-3">
            <Cloud className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-white">
            {mode === 'signin' ? 'Bulut Hesabına Giriş Yap' : 'Yeni Bulut Hesabı Oluştur'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            İzleme listelerin, puanların ve eşleşmelerin tüm cihazlarında korunsun.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setErrorMsg('')
              setSuccessMsg('')
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setErrorMsg('')
              setSuccessMsg('')
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Hesap Oluştur
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs leading-relaxed">
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Kullanıcı Adı / Rumuz
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Örn: Sinemasever"
                  className="w-full py-2.5 pl-9 pr-3 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full py-2.5 pl-9 pr-3 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full py-2.5 pl-9 pr-3 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-sky-600/25 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <span>Giriş Yap ve Senkronize Et</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Hesabı Oluştur ve Yedekle</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security badge note */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Şifreniz Supabase Auth ile uçtan uca şifrelenir.</span>
        </div>
      </div>
    </div>
  )
}
