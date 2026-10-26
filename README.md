# 🍿 Neİzlesek — Bu Akşam Ne İzlesek?

> Tinder tarzı kart kaydırma dinamikleri, zevk analitiği, Supabase Realtime canlı oda senkronizasyonu ve TMDb Türkiye kataloğuyla çiftler, arkadaş grupları ve bireysel sinemaseverler için geliştirilmiş yeni nesil akıllı film karar motoru.

![React](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ecf8e?style=flat-square&logo=supabase)
![PWA](https://img.shields.io/badge/PWA-Ready-f59e0b?style=flat-square)

---

## 🌟 Öne Çıkan Özellikler

### 1. 🃏 Sinematik Swipe Deck (Kart Kaydırma)
- **Doğal Hareket Fiziği:** Sağa kaydır (**Beğen**), Sola kaydır (**Pas**), Aşağı veya Yukarı çek (**İzlendi**).
- **Hızlı Fırlatma (Flick):** 65px sabit hassas eşik ve 380ms altındaki hızlı parmak hareketlerini algılayan akıllı fizik motoru.
- **Instagram Tarzı Çift Dokunma:** Afişe hızlıca iki kez dokunulduğunda merkezde dev kırmızı kalp patlaması (`animate-heart-burst`), haptik titreşim ve ses efektiyle anında beğenme.
- **Akıllı Geri Alma (Undo):** Yanlış kaydırılan kartları tek tıkla (`RotateCcw` veya klavyede `Z` / `Backspace`) geri alma; sayfalar arası geçişte ve oda modunda Supabase veritabanıyla senkronize çalışma.
- **Tepkisel Kart Işıması & Damgalar:** Kart çekildiği yöne göre kenarlardan yeşil, kırmızı veya mor neon ışık saçar; elastik damgalar belirir.

### 2. 🎯 Kişiselleştirilmiş Zevk Uyumu (`%94 Sana Uygun`)
- **Cold-Start Kalibrasyonu:** İlk açılışta sunulan kült 30 film üzerinden kullanıcının tür zevk haritası (`genreScores`) çıkarılır.
- **Dinamik Eşleşme Rozeti:** Kartlar üzerinde kullanıcının tür afinitesi ve IMDb/TMDb puanı harmanlanarak **`🎯 %94 Sana Uygun`** rozeti gösterilir.

### 3. 👥 İkili Çift & Çoklu Arkadaş Grubu (Watch Party)
- **İkili Mod (Çiftler):** 25 film sonunda iki tarafın ortak beğendiği filmde anında konfeti patlaması (`MatchModal`) ve nerede izlenebileceği bilgisi (Netflix, Prime, Disney+, BluTV, tabii vb.).
- **Çoklu Watch Party (3-5 Kişi):** Canlı lobi (`RoomWaitingLobby`), oy çokluğu algoritması, canlı katılımcı ilerleme takibi ve tur sonunda 🥇 1., 🥈 2., 🥉 3. podyum ekranı.
- **📱 QR Kod ile Tek Tıkla Bağlanma:** Bekleme lobisindeki ve profildeki "QR Kod" butonuyla partneriniz 6 haneli kodu yazmaya gerek kalmadan telefon kamerasını ekrana tutarak anında odaya katılır.
- **Canlı Realtime Geri Alma Senkronizasyonu:** Partner bir filmi geri aldığında ilerleme çubuğu karşı cihazda da anlık olarak bir geriye düşer.
- **Veto Mekanizması:** Tur başına 3 sınırlı veto hakkı; bir üyenin veto ettiği film tüm katılımcıların ekranından anında düşürülür.

### 4. 🎰 "Kararsızım, Sen Seç!" (Film Ruleti)
- Beğenilen veya eşleşilen onlarca film arasından seçim yapamayan kullanıcılar için slot makinesi animasyonlu, sesli ve konfetili rastgele film seçici modalı. Üst bardaki zar butonundan veya profilden tek tıkla açılır.

### 5. 🔍 Global TMDb Film Arama & Hızlı 1-10 Puanlama
- **Canlı Film Arama:** Üst bardaki arama butonuyla açılan modal üzerinden milyonlarca film arasında anlık arama, popüler öneri etiketleri ve doğrudan listeye ekleme.
- **Hızlı Puanlama Çubuğu:** Ana akışta bir film aşağı kaydırılarak "İzlendi" olarak işaretlendiğinde, ekranın altında zarif bir 1-10 puan çubuğu belirir.

### 6. 🔊 Hafif Ses Efektleri (Web Audio API)
- 0 KB harici dosya boyutuyla, tarayıcının yerel ses sentezleyicisi üzerinden kaydırma tınıları, kalp patlaması tınısı, eşleşme kutlama fanfarı ve rulet tık sesleri. Üst bardaki (🔊 / 🔇) anahtarıyla tek tıkla açılıp kapatılabilir.

### 7. 📊 Zevk Analitiği & Hayat Sayacı
- **Sinema Ömrü:** *"Bugüne kadar hayatının X günü, Y saatini film izleyerek geçirdin"* hayat sayacı.
- **Çift Uyumu:** İki partnerin zevk profilleri üzerinden kosinüs benzerliği formülü ile `%XX Çift Uyumu` skoru.
- **Eşleşme Arşivi:** Bugüne kadar eşleşilen tüm filmlerin tarih, oda kodu ve partner adı ile arşivlenmesi.

### 8. 📥 Liste Dışa Aktarma (Letterboxd / CSV Export)
- "İzlediklerim" (puanlarıyla birlikte) ve "İzlemek İstediklerim" listelerini Excel ve Letterboxd uyumlu, Türkçe karakter destekli UTF-8 BOM `.csv` formatında tek tıkla indirme.

### 9. 📱 PWA & Mobil Cihaz Deneyimi
- Tarayıcı çubuğu olmadan tam ekran mobil çalışma (`display: standalone`).
- Sağa/sola/aşağı kaydırmada, vetoda ve eşleşmede dokunsal titreşim motoru (`haptics.ts`).
- Çevrimdışı temel kabuk önbellekleme (`sw.js`).
- Google Play Store TWA (`.well-known/assetlinks.json`) dijital varlık doğrulaması.

---

## 🛠️ Teknoloji Mimarisi

| Katman | Teknoloji / Kütüphane | Amaç |
| :--- | :--- | :--- |
| **Arayüz (UI)** | React 19, TypeScript (Strict) | Tip güvenli bileşen hiyerarşisi |
| **Stil & Tasarım** | Tailwind CSS v4, Lucide Icons | Modern koyu tema (`zinc-950`), cam efektleri |
| **Veritabanı & Realtime** | Supabase (PostgreSQL, Realtime, Presence) | Canlı oda senkronizasyonu, lobi, eşleşme |
| **Film Verisi & Sağlayıcılar** | TMDb (The Movie Database) API, JustWatch | Türkiye afişleri, özetler, türler ve platformlar |
| **Ses & Efektler** | Web Audio API, Canvas Confetti | 0 KB harici ses sentezi, görsel kutlamalar |
| **Derleyici & Performans** | Vite 6, Rollup manualChunks, React.lazy | 300 kB optimize paket boyutu, kod bölümleme |

---

## 🚀 Yerel Kurulum & Çalıştırma

### Gereksinimler
- Node.js 18+ ve npm
- TMDb API Anahtarı ([themoviedb.org](https://www.themoviedb.org/settings/api))
- Supabase Projesi ([supabase.com](https://supabase.com))

### Adımlar

1. Depoyu klonlayın ve klasöre girin:
   ```bash
   git clone https://github.com/Omerhaan/NeIzlesek.git
   cd NeIzlesek
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. `.env.local` dosyasını oluşturun ve anahtarlarınızı girin:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_TMDB_API_KEY=your-tmdb-api-key
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

5. Üretim derlemesi (Production Build):
   ```bash
   npm run build
   ```

---

## 🌐 Vercel ile Canlı Dağıtım (Production)

Proje Vercel için tam uyumlu [`vercel.json`](vercel.json) konfigürasyonu içerir:

1. [vercel.com/new](https://vercel.com/new) adresine gidin ve GitHub deponuzu **Import** edin.
2. **Environment Variables** bölümüne şu 3 anahtarı ekleyin:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TMDB_API_KEY`
3. **Deploy** butonuna basın. Uygulamanız 45 saniyede canlıya çıkacaktır!

---

## 🗄️ Veritabanı Şeması

Veritabanı migration script'i [`supabase_schema_v2.sql`](supabase_schema_v2.sql) dosyasında yer almaktadır. Supabase Dashboard → **SQL Editor** içinde çalıştırıldığında şu tabloları yapılandırır:

- `match_rooms`: Oda kodu, durum (`waiting`, `active`, `matched`), eşleşen film ID, tur numarası.
- `room_swipes`: Oda ID, kullanıcı rumuzu, film ID, aksiyon (`like`, `pass`, `watched`, `veto`), tur numarası.
- `room_user_decks`: Her oda katılımcısı için özel 25 film sırası.
- `room_participant_tastes`: Ortak tür önerileri için katılımcı zevk skorları.

---

## 📜 Yasal Uyarı & Lisans

- Bu ürün [TMDb](https://www.themoviedb.org/) API kullanmaktadır ancak TMDb tarafından onaylanmamış veya sertifikalandırılmamıştır.
- Çevrim içi yayın sağlayıcı verileri [JustWatch](https://www.justwatch.com/) üzerinden sunulmaktadır.
- MIT Lisansı ile lisanslanmıştır.
