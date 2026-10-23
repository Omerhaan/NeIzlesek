import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { appConfigIssues } from './config'

const root = createRoot(document.getElementById('root')!)

if (appConfigIssues.length > 0) {
  root.render(
    <main className="min-h-screen w-full overflow-auto bg-zinc-950 p-6 text-zinc-100 sm:p-10">
      <section className="mx-auto mt-12 max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Neİzlesek · Kurulum</p>
        <h1 className="text-2xl font-black">Uygulama ayarları eksik</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Projeyi başlatmak için kök dizindeki <code className="text-zinc-200">.env.local</code> dosyasını doldurup geliştirme sunucusunu yeniden başlatın.
        </p>
        <ul className="mt-5 space-y-2">
          {appConfigIssues.map((issue) => <li key={issue} className="rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm">{issue}</li>)}
        </ul>
        <p className="mt-5 text-xs text-zinc-500">Örnek değişken adları: <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>, <code>VITE_TMDB_API_KEY</code>.</p>
      </section>
    </main>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  // Register PWA Service Worker
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA ServiceWorker registration error:', err)
      })
    })
  }
}
