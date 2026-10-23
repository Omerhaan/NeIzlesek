import { X, ShieldCheck, Film, Lock, Database, Mail } from 'lucide-react'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Gizlilik & Yasal Şartlar
              </h2>
              <p className="text-[11px] text-zinc-400">KVKK, TMDb Atfı ve Kullanım Koşulları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
          {/* Section 1: TMDb & JustWatch Attribution */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Film className="w-4 h-4 text-emerald-400" />
              <span>TMDb ve JustWatch Yasal Atfı</span>
            </div>
            <p className="text-zinc-300">
              Bu ürün, film verilerini, afişlerini, özetlerini ve oyuncu kadrosu bilgilerini sunmak
              için <strong>The Movie Database (TMDb) API</strong>&apos;sini kullanmaktadır. Ancak bu
              uygulama TMDb tarafından onaylanmamış veya sertifikalandırılmamıştır.
            </p>
            <p className="text-zinc-400 text-[11px]">
              Çevrim içi yayın platformu (Netflix, Prime Video, BluTV, Disney+, tabii) izleme
              bilgileri <strong>JustWatch</strong> altyapısı ile sağlanmaktadır.
            </p>
          </div>

          {/* Section 2: KVKK & Data Privacy */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Veri Gizliliği & KVKK</span>
            </div>
            <p className="text-zinc-300">
              Neİzlesek, kaydettiğiniz film beğenilerini, pasları ve izleme listelerini yalnızca size
              ve oda partnerinize kişiselleştirilmiş film önerileri sunmak amacıyla işler.
            </p>
            <p className="text-zinc-400 text-[11px]">
              Verileriniz hiçbir şekilde üçüncü taraf reklam şirketlerine satılmaz veya pazarlama
              amacıyla paylaşılmaz.
            </p>
          </div>

          {/* Section 3: Cookies & Local Storage */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Yerel Depolama & Çerezler</span>
            </div>
            <p className="text-zinc-300">
              Uygulama, oturum bilgilerinizi, seçtiğiniz avatarı ve izleme geçmişinizi cihazınızın{' '}
              <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">localStorage</code>{' '}
              ve <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">sessionStorage</code>{' '}
              alanında saklar.
            </p>
          </div>

          {/* Section 4: Contact */}
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sorular ve geri bildirim için:</span>
            </div>
            <span className="font-mono text-zinc-300">destek@neizlesek.app</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
