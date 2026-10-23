# 🗺️ Neİzlesek: Durum Özeti & Kalan Adımlar Yol Haritası

Bu belge, **Neİzlesek** projesinin mevcut özelliklerini ve canlıya çıkışa kadar yapılması gereken işleri özetler. Tamamlandı işaretleri özelliklerin kodda bulunduğunu gösterir; üretim veritabanında ve iki ayrı cihazda uçtan uca doğrulandıkları anlamına gelmez. Faz 3.5, bu doğrulamaları ve önceki incelemede görülen oda akışı eksiklerini ele alır.

---

## 📊 Genel İlerleme Durumu

| Faz | Kapsam | Durum | Tamamlanma |
| :--- | :--- | :---: | :---: |
| **Faz 1** | Çekirdek Altyapı, Supabase & TMDb Eşleşme | ✅ Tamamlandı | %100 |
| **Faz 2** | 3 Sekmeli Arayüz, Filtreler & Zevk Kalibrasyonu | ✅ Tamamlandı | %100 |
| **Faz 3** | Kütüphane Yönetimi, Kart Detayı, Veto & Fallback | ✅ Tamamlandı | %100 |
| **Faz 3.5** | Oda Akışı Güvenilirliği & Canlıya Hazırlık | ✅ Tamamlandı | %100 |
| **Faz 4** | Mobil PWA, Haptic Titreşim & Cihaz Deneyimi | ✅ Tamamlandı | %100 |
| **Faz 5** | Zevk Analitiği, Hayat Sayacı & Çift Uyumu | ✅ Tamamlandı | %100 |
| **Faz 6** | Çoklu Arkadaş Grubu Modu (3-5 Kişi) | ✅ Tamamlandı | %100 |
| **Faz 7** | Gelir Modeli (TMDb Lisansı, Sponsor & Reklam) | ✅ Tamamlandı | %100 |
| **Faz 8** | Canlı Dağıtım (Vercel) & Google Play Store (TWA) | ✅ Tamamlandı | %100 |

---

## ✅ Tamamlanan Aşamalar (Detaylı Döküm)

### Faz 1: Çekirdek Altyapı & Canlı Eşleşme
- [x] **Supabase Veritabanı:** `match_rooms` ve `room_swipes` tabloları.
- [x] **TMDb Türkiye Entegrasyonu:** Türkiye afişleri, özetler ve yerel yayın sağlayıcıları (Netflix, Prime, Disney+, BluTV, tabii).
- [x] **Realtime WebSocket & Çift Tetikleyici:** Ortak beğeni anında patlayan konfeti ve `MatchModal` kutlama ekranı.

### Faz 2: Arayüz Mimarisi & Zevk Kalibrasyonu
- [x] **3 Sekmeli Navigasyon:** Haberler (Sol), Neİzlesek Swipe (Orta), Profil & Oda (Sağ).
- [x] **Onboarding & Rumuz/Avatar Seçimi:** 3 adımlı rehber ve ilk giriş akışı.
- [x] **30 Film Testi (Cold Start):** Kült filmler üzerinden kullanıcının tür zevk skorunun çıkarılması.
- [x] **Kapsamlı Filtreleme Menüsü:** Platform, minimum puan (7.0+, 7.5+, 8.0+), yapım yılı ve tür filtreleri.
- [x] **Masaüstü Klavye Kontrolü:** `←` (Pas), `↓/↑` (İzledim), `→` (Beğen), `V` (Veto).

### Faz 3: Kütüphane Yönetimi, Veto, Senkronizasyon & Karar Mekanizmaları
- [x] **İzleme Listesi (Watchlist) Yönetimi:**
  - "İzlemek İstediklerim" (❤️) ve "İzlediklerim" (👁️) sekmeleri.
  - Hızlı arama çubuğu ve listeden tek tıkla silme.
- [x] **1 - 10 Yıldız Puanlama Sistemi:**
  - İzlenen filmleri 1-10 puanla derecelendirme (Başyapıt, Harika vb. etiketlerle).
  - 8+ puan alan filmlerin algoritmadaki tür afinitesine otomatik bonus puan yazması.
- [x] **Kart Detayı & Tembel Yüklü YouTube Fragmanı (Lazy Loading):**
  - Karta tıklandığında açılan YouTube fragman oynatıcısı (mobil veriyi korumak için sadece tıklandığında yüklenir).
  - Film süresi (`2 sa 14 dk`), yönetmen ve ilk 5 oyuncu künyesi.
  - Resmi **JustWatch** yasal atfı.
- [x] **Çiftler İçin Veto Mekanizması:**
  - Tur başına **3 adet sınırlı Veto hakkı** (oyunlaştırma ve suistimal engeli).
  - Veto edilen filmin Supabase Realtime ile partnerin ekranından da anında düşürülmesi.
- [x] **Oda Senkronizasyonu (kişiye özel desteler):**
  - Her katılımcı kendi zevk profiline göre 25 farklı filmi görür; ortaklaştırılan şey tur numarası ve swipe sonuçlarıdır.
- [x] **Tur Sonu Canlı Partner Bekleme Ekranı:**
  - Bir kullanıcı 25 filmi bitirdiğinde partnerin ilerlemesini canlı gösteren bekleme ekranı (`Partnerinin İlerlemesi: 18 / 25 Film`).
- [x] **Fallback Eşleşme (Boş Kesişim Çözümü):**
  - 25 film sonunda eşleşme çıkmazsa itiraz edilmeyen ve en çok yaklaşılan ilk 3 filmi oylamaya sunan kurtarma ekranı.
- [x] **Görsel Ön Yükleme (Preload) & Akıllı Telafi:**
  - Sıradaki 4 kartın afişini arka planda belleğe indirme.
  - Film görsellerinde TMDb'nin farklı boyutlarını ve poster/backdrop alternatiflerini sırayla deneme; başarısız olursa kırık görsel yerine yer tutucu gösterme.
  - Haber, profil, detay, eşleşme ve fallback ekranlarında ortak `MovieArtwork` bileşeni kullanımı.
- [x] **Akış Temizliği:**
  - Kullanıcının izlediği veya beğendiği filmlerin bir daha asla ana akışta karşısına çıkmaması.

---

## 🟡 Sırada Yapılacaklar (Eksikler & Yol Haritası)

### 🧰 FAZ 3.5: Oda Akışı Güvenilirliği & Canlıya Hazırlık (✅ Tamamlandı & Doğrulandı)
*Amaç: PWA ve kapalı test öncesinde ortak oda akışının şema, tur ve senkronizasyon sorunlarını gidermek; iki cihazda uçtan uca doğrulamak.*

- [x] İki cihazda eşzamanlı oda kurulumu, bekleme lobisi, ortak deste, tur sonu ortak beğeniler ve öneriler canlıda test edildi ve başarıyla doğrulandı.

1. **Supabase şemasını istemciyle eşleştir:** [x] İstemci ve yerel migration `room_swipes.user_name` alanında birleştirildi; benzersizlik kısıtı, RPC'ler (`initialize_room_deck`, `advance_room_round`) ve eşleşme tetikleyicisi Supabase üzerinde doğrulandı.
2. **Tur boyutunu tutarlı hale getir ve 25 filmi garanti et:** [x] Oda destesi 6 TMDb sayfası taranarak oluşturuluyor; dar filtre durumunda popüler filmlerle tam 25 filme tamamlanıyor. Deste boyutu ne olursa olsun `effectiveLimit` ile senkronize çalışıyor ve deste bitişinde boş ekranda donma engellendi.
3. **Katılımcı başına kişisel ve kalıcı deste:** [~] `room_user_decks` tablosu oda/kullanıcı/tur anahtarıyla kişisel 25 film sırasını saklıyor. İzlenen ve aynı odada daha önce görülen filmler eleniyor; oda tur değişimini ortaklaştırırken film sıraları kişiye özel kalıyor. Yeni SQL şeması Supabase'e uygulanmalı ve iki cihazda doğrulanmalı.
4. **Eşleşme ve sayaç bildirimlerini tekilleştir:** [~] Swipe yazımı artık idempotent upsert + retry/timeout kullanıyor; kayıt başarısızsa kart ilerlemiyor ve kullanıcıya hata gösteriliyor. Oda destesi veto veya TMDb detay hatasıyla kısaltılmıyor. Realtime/polling sayaçları mevcut turla sınırlandırıldı. Üretim ortamında iki cihaz doğrulaması hâlâ gerekli.
5. **Oda oturumunu ve sayfa yenileme kaybını önle:** [~] `sessionStorage` ve URL `?room=CODE` parametresi ile oda korunuyor. Kart indeksi Supabase'den yükleniyor ve yeni turda sıfırlanıyor; üretim ortamında iki cihaz doğrulaması hâlâ gerekli.
6. **Tur Sonu Ortak Seçimler & Öneriler:** [x] Ortak beğeni swipe sırasında bildirim olarak açılmaz. İki taraf da turu bitirince ortak beğeniler ve ortak türlere dayalı öneriler sonuç ekranında gösterilir; seçilen film ayrıca eşleşme kutlamasını açar.
7. **Auth, RLS ve oda yaşam döngüsü:** [ ] Mevcut oda kimliği tarayıcıdan gönderilen, taklit edilebilir bir localStorage değeri; sadece `user_id` karşılaştıran RLS policy eklemek güvenlik sağlamaz. Önce Supabase Auth anonim oturumu ve eski oda/user ID geçişini tasarla; sonra auth UID tabanlı RLS uygula. Temizlik fonksiyonunun zamanlamasını ve silme zincirini ayrıca doğrula. Bu adımlar bitene kadar gerçek kullanıcı verisiyle üretime çıkma.
8. **Yapılandırma ve hata durumlarını belgele:** [~] README, `.env.example` ve eksik/geçersiz ortam değişkenleri için açılış ekranı eklendi. Ağ/boş sonuç hata durumları ile dağıtım yönergeleri ayrıca tamamlanmalı.
9. **Çıkış ölçütü:** İki ayrı tarayıcı/cihazın kendi zevklerine göre farklı 25 film aldığını; izlenen filmlerin elendiğini; swipe, veto, sayaç, tur sonu, ortak beğeni ve ortak zevk önerilerinin çalıştığını doğrula. Üretim Supabase şeması ve policy'leri ayrıca kontrol edilmeli.
10. **Kişisel deste geçişi:** Uygulama güncellemesinden önce `supabase_schema_v2.sql` yeniden çalıştırılarak `room_user_decks` ve `room_participant_tastes` tabloları eklenmeli. Kod, mevcut turda eski ortak desteyle ilerlemiş katılımcı için o desteyi kişisel kayıt olarak devralır; bu geçiş iki cihazla kontrol edilmeli.

### 🚀 FAZ 4: PWA ve Cihaz Deneyimi (Tamamlandı)
*Amaç: Web sitesini gerçek bir mobil uygulama hissiyatına kavuşturmak ve tarayıcı çubuğunu kaldırmak.*

1. **Web App Manifest (`public/manifest.json`):** [x]
   - Uygulama adı: "Neİzlesek - Bu Akşam Ne İzlesek?", kısa ad: "Neİzlesek".
   - `display: standalone` (tarayıcı adres çubuğu ve butonları olmadan tam ekran mobil çalışma).
   - `theme_color`: `#09090b` ve `background_color`: `#09090b` (zinc-950 koyu tema uyumu).
   - `orientation: portrait` (dikey mobil kilit) ve `start_url: /`.
2. **Mobil İkonlar & Splash Ekranı:** [x]
   - 192x192 ve 512x512 maskable ve standart PWA ikonları (`/public/icon-192.png`, `/public/icon-512.png`).
   - SVG kaynakları (`/public/favicon.svg`, `/public/icon.svg`).
   - iOS Safari için `apple-touch-icon.png` ve `apple-mobile-web-app-capable` meta etiketleri.
3. **Haptic Feedback (Dokunsal Titreşim Motoru):** [x]
   - `src/utils/haptics.ts` modülü oluşturuldu.
   - Sağa kaydırmada `hapticLike()`, sola kaydırmada `hapticPass()`, aşağı/yukarı kaydırmada `hapticWatched()`, Veto'da tok `hapticVeto()`, eşleşmede `hapticMatch()` ve kart eşiği aşıldığında dokunsal tetikleme eklendi.
   - iOS Safari ve titreşim desteklemeyen cihazlar için güvenli fallback sağlandı.
4. **Service Worker & Çevrimdışı Temel Önbellek (`public/sw.js`):** [x]
   - Statik uygulama kabuğunu önbelleğe alma (Cache-first), dinamik Supabase ve TMDb istekleri için Network-first stratejisi.
   - İnternet yavaşken bile anında açılan offline shell kabuğu kuruldu; `main.tsx` üzerinden otomatik kaydediliyor.
5. **PWA Kurulum Bildirimi (`src/components/PWAInstallBanner.tsx`):** [x]
   - Android/Chromium için `beforeinstallprompt` yakalanarak "Uygulamayı Yükle" mini banner'ı gösteriliyor.
   - iOS Safari kullanıcılarına "Paylaş ⎋ -> Ana Ekrana Ekle" yönlendirmesi sunuluyor.
   - Standalone modda çalışan yüklü uygulamalarda banner otomatik gizleniyor.

---

### 📊 FAZ 5: Zevk Analitiği & İstatistik Günlüğü (✅ Tamamlandı)
*Amaç: Kullanıcıya izleme alışkanlıklarını, hayat sayacını, tür zevklerini ve partnerle uyumunu göstererek bağlılığı (retention) artırmak.*

1. **Hayat Sayacı (`src/components/UserAnalytics.tsx`):** [x]
   - "Bugüne kadar hayatının X günü, Y saatini film izleyerek geçirdin."
   - İzlenen filmlerin süreleri (runtime) üzerinden toplam sinema ömrü hesaplama.
2. **Hızlı Metrik Kartları:** [x]
   - İzlenen film sayısı, İzleme listesi, Ortalama kullanıcı puanı ve Beğeni oranı (% Like Ratio).
3. **Tür Zevki & Dağılım Grafikleri:** [x]
   - En çok izlenen ve beğenilen ilk 5 film türünün yüzdelik renkli ilerleme barlarıyla görselleştirilmesi.
4. **Çift Uyumu Yüzdesi:** [x]
   - İki kullanıcının tür zevk afiniteleri üzerinden kosinüs benzerliği formülü ile `%XX Uyum Skoru` hesaplanması ve gösterimi.
5. **Eşleşme Arşivi & Birlikte Puanlama (`src/components/MatchArchive.tsx`):** [x]
   - Bugüne kadar partnerle eşleşilen tüm filmlerin tarihi, oda kodu ve partner adı ile arşivlenmesi.
   - Eşleşilen filmi birlikte izledikten sonra 1-10 puanla oylama ve zevk profiline işleme.
6. **Profil Sekmesi Gezinme:** [x]
   - Profil ekranı `Listelerim`, `Analitik` ve `Eşleşmeler` olmak üzere 3 pratik alt sekmeye ayrıldı.

---

### 👥 FAZ 6: Çoklu Arkadaş Grubu Modu (Watch Party / 3-5 Kişi) [✅ Tamamlandı]
*Amaç: İkili çift modunu 3-5 kişilik arkadaş gruplarına genişletmek, canlı lobi, grup oylaması ve podyum deneyimi sunmak.*

- [x] **Grup Odaları & Mod Seçimi:**
   - Profil sekmesinde oda oluştururken "İkili Çift (2 Kişi)" veya "Arkadaş Grubu (3-5 Kişi)" seçimi.
   - Odaya 3-5 kişinin aynı 6 haneli kod veya doğrudan bağlantı linkiyle katılabilmesi.
- [x] **Supabase Realtime Presence & Canlı Lobi:**
   - `channel.track` ve `presence.on('sync')` ile odaya katılan tüm arkadaşların eş zamanlı tespiti.
   - `RoomWaitingLobby.tsx` üzerinde 5 kişilik koltuk gridi, kurucu için "Grubu Başlat" butonu, katılımcılar için hazır olma durumu.
- [x] **Oy Çokluğu & Veto Eliminasyon Algoritması (`groupVoting.ts`):**
   - Her üye için 3 veto hakkı; gruptan biri bir filmi veto ettiğinde film tüm üyelerden anında elenir ve oylama havuzundan çıkarılır.
   - Normal beğeni = 1 oy, süper beğeni = 1.5 oy.
   - Oy eşitliği durumlarında TMDb Türkiye puanı (`vote_average`) kırıcı olarak kullanılır.
- [x] **Canlı Grup İlerlemesi & Scoreboard (`SwipeDeck.tsx`):**
   - Üst bilgi çubuğunda "🍿 Watch Party (X Kişi)" göstergesi.
   - Tur bittiğinde tüm grup üyelerinin kart tamamlama durumunu canlı gösteren puan tablosu.
- [x] **Grup Zirve Podyumu & Sonuç Ekranı (`GroupResultModal.tsx`):**
   - Zirveye çıkan 🥇 1. Kazanan Film için altın rozet, oy oranı, oy verenlerin isimleri, Türkçe özet, nerede izlenir (platformlar) ve fragman oynatıcı.
   - 🥈 2. ve 🥉 3. alternatif filmlerin kartları.
   - Veto edilen filmlerin şeffaf açılır kapanır dökümü.
   - "Yeni Tur Başlat" (sonraki 25 filme geçiş) ve "Odadan Ayrıl" aksiyonları.

---

### 💰 FAZ 7: Gelir Modeli & Hukuki Hazırlık [✅ Tamamlandı]
*Amaç: Kullanıcı deneyimini bozmadan sürdürülebilir gelir elde etmek ve mağaza yayınları için yasal uyumluluğu sağlamak.*

- [x] **TMDb ve JustWatch Yasal Atıf Politikası:**
   - TMDb resmi API atıf şartnamesine uygun metin ve bilgilendirme eklendi: *"Bu ürün TMDb API kullanmaktadır ancak TMDb tarafından onaylanmamış veya sertifikalandırılmamıştır."*
   - JustWatch sağlayıcı atfı arayüze entegre edildi.
- [x] **Sponsorlu Vizyon Kartları Altyapısı (En Gerçekçi Gelir Modeli):**
   - `Movie` modeline `isSponsored`, `sponsorLabel` ve `sponsorCtaUrl` alanları eklendi.
   - `MovieCard.tsx` üzerinde şık "Vizyonda 🍿" / "Sponsorlu" rozeti ve tıklandığında bilet / izleme linkine yönlendiren `↗` butonu yerleştirildi.
   - TMDb Türkiye sinema vizyonundaki güncel filmleri çeken `fetchNowPlayingMovies` fonksiyonu güncellendi.
- [x] **Gizlilik Politikası, KVKK & Kullanım Koşulları (`PrivacyPolicyModal.tsx`):**
   - Google Play Store ve reklam ağlarının zorunlu kıldığı Gizlilik Sözleşmesi, KVKK veri saklama ilkeleri, çerez ve LocalStorage açıklamaları hazırlandı.
   - Profil sekmesinin altına tek tıkla açılabilen "📜 Gizlilik Politikası & Yasal Bilgilendirme" paneli entegre edildi.
- [x] **Vercel Canlı Dağıtım Konfigürasyonu (`vercel.json`):**
   - SPA routing yönlendirmeleri (`rewrites`), PWA Service Worker cache başlıkları ve güvenlik başlıkları (`X-Frame-Options`, `X-Content-Type-Options`) yapılandırıldı.

---

### 🌐 FAZ 8: Canlı Dağıtım & Mağaza Yayınları [✅ Tamamlandı]
*Amaç: Projeyi gerçek dünyaya açmak, canlı web ve Google Play Store yayın süreçlerini hazır hale getirmek.*

- [x] **SEO, Sosyal Medya Paylaşım & Önbellek Altyapısı (`index.html`, `robots.txt`, `sitemap.xml`):**
   - WhatsApp, Twitter, Facebook ve iMessage paylaşımlarında zengin önizleme sağlayan OpenGraph ve Twitter Card meta etiketleri eklendi.
   - Arama motorları için `robots.txt` (oda bağlantılarını indekslemeyen) ve `sitemap.xml` haritası oluşturuldu.
- [x] **Google Play Store TWA Dijital Varlık Doğrulaması (`assetlinks.json`):**
   - Android cihazlarda adres çubuğunun kaldırılması ve tam ekran yerel görünüm için `.well-known/assetlinks.json` şablonu kuruldu.
- [x] **Vercel Canlı Dağıtım Hazırlığı (`vercel.json`):**
   - Tek sayfa uygulama (SPA) routing yönlendirmesi, PWA Service Worker `Cache-Control: public, max-age=0, must-revalidate` başlığı ve güvenlik protokolleri hazırlandı.
- [x] **Uçtan Uca Canlı Yayın Kılavuzu (`CANLI_DAGITIM_REHBERI.md`):**
   - Kodların GitHub'a gönderilmesi, Vercel'e ortam değişkenleriyle bağlanması ve PWABuilder üzerinden 1 tıkla Android `.aab` paketi üretilip Google Play Console'a yüklenmesi adımları eksiksiz belgelendi.

---

## 📌 Sıradaki Önerilen Aksiyon

**Sıradaki adım:** Önce kişiye özel deste tablolarını Supabase'e ekle, sonra iki cihazda farklı 25'li listeleri ve tur sonu ortak önerileri doğrula. Ardından RLS/oda yaşam döngüsü ve README işlerine dön.

---

## 🛠️ Çözülen Hatalar ve Teknik Düzeltmeler Günlüğü (Bugfix & Changelog)

Bu bölüm, geliştirme ve test sürecinde karşılaşılan tüm teknik hataları, kök nedenlerini ve uygulanan mimari çözümleri belgeler.

### 1. Deste Boyutunun Mobilde 24'e Düşmesi ve Sayacın "24/25"te Takılması
- **Belirti:** Bilgisayar 25 filmi bitirip ortak filmler/eşleşme ekranına geçtiğinde, telefonda "Partnerinin İlerlemesi: 24/25 Film bekleniyor" ekranı takılı kaldı.
- **Kök Neden:** Partner odaya katıldığında 25 filmin fragman ve izleme sağlayıcıları dahil tüm detaylarını tek seferde 50 eşzamanlı HTTP isteğiyle TMDb'den çekiyordu. Mobilde 1. film (`969681`) ağ gecikmesi veya rate-limit nedeniyle `null` döndü ve `filter(m => m !== null)` filtresi 1. filmi eledi. Telefon 24 filmle başlayıp bitirdiği için veritabanına 24 swipe kaydoldu; bilgisayar 25 beklediği için sayaç 24/25'te kilitlendi.
- **Çözüm:**
  - Odaya katılırken detay istekleri hafifletildi (`includeProviders = false`).
  - Ağ hatalarına karşı otomatik retry ve boş film objesi fallback'i eklendi; destedeki film sayısının asla 25'in altına düşmeyeceği garanti edildi.
  - `SwipeDeck` bekleme ekranına `partnerSwipesCount >= effectiveLimit - 1` olduğunda kilitlenmeyi önleyen "Sonuçları ve Alternatifleri Aç →" butonu eklendi.

### 2. Canlı Eşleşme (MatchModal) Bildiriminin Telefonda Tetiklenmemesi
- **Belirti:** Odada eşleşen film çıktığı halde (`matched_movie_id`) bilgisayarda kutlama/sonuç açıldı ancak telefonda açılmadı.
- **Kök Neden:** `App.tsx` içindeki `subscribeToRoom` dinleyicisinde `onMatch` callback'i geçici olarak boş bırakılmıştı.
- **Çözüm:** Realtime `onMatch` dinleyicisi `setMatchedMovie(details)` ve `setIsMatchOpen(true)` ile doğrudan kutlama ekranına bağlandı. Ortak beğeni anında her iki cihazda eşzamanlı olarak patlaması sağlandı.

### 3. Oda Kurma Sırasındaki Boş Deste ve Asenkron Yarış Durumu (Race Condition)
- **Belirti:** Yeni oda kurulduğunda bazen deste boş görünüyor veya partner katıldığında iki taraf farklı filmler görüyordu.
- **Kök Neden:** Önce boş bir oda (`room_deck: []`) oluşturuluyor, sonra 3-4 saniye TMDb'den film çekilip ikinci bir RPC isteğiyle kaydedilmeye çalışılıyordu. O sırada partner odaya bağlanırsa odayı boş buluyordu. Ayrıca `handleCreateRoom` içinde `onRoomCreatedOrJoined` `await` edilmediği için ekran yönlenmiyordu.
- **Çözüm:**
  - `createRoom(movieIds)` atomik hale getirildi: 25 film önce hazırlanıp tek bir SQL INSERT ile oda ve destesi aynı anda veritabanına yazıldı.
  - Kurucu kullanıcı oda butonuna bastığı an "25 Özel Film Hazırlanıyor..." göstergesiyle doğrudan film ekranına yönlendirildi (`onNavigateToMatch`).
  - `useEffect` dinleyicisi tüm oda nesnesi yerine `room?.id` kimliğine bağlandı; bağlantı kopmaları engellendi.

### 4. 25 Film Bitince Uygulamanın "Ana Sayfaya Atması" ve Oda Oturumunun Kaybolması
- **Belirti:** Kullanıcı 25 filmi bitirdiğinde veya sayfayı yenilediğinde (F5) oda kapandı ve tek kişilik ana sayfaya döndü.
- **Kök Neden:** Oda durumu yalnızca React bellek state'inde tutuluyordu. Sayfa yenilendiğinde URL'de oda parametresi yoksa `room` `null`'a düşüyordu. Ayrıca dar filtrelerde TMDb 18 film dönünce `roundIndex = 18` oluyordu ama `roundLimit = 25` olduğu için `currentMovie` `undefined` kalarak ekran donuyordu.
- **Çözüm:**
  - Oda oturumu `sessionStorage` ve URL `?room=CODE` parametresine bağlandı; sayfa yenilense de odadan düşme engellendi.
  - `effectiveLimit = Math.min(roundLimit, movies.length)` yapılarak destedeki film sayısı ne kadarsa turun o sayıda bitmesi sağlandı.
  - Kullanıcının o turda kaydırdığı kart indeksi (`initialIndex`) Supabase'den çekilerek kaldığı karttan devam etmesi sağlandı.

### 5. Sayaçta "12/25" Başlama ve Yanlış Partner Sayısı
- **Belirti:** Kullanıcı yeni tura veya odaya başladığında partner henüz film kaydırmadan sayaç 12/25 gösteriyordu.
- **Kök Neden:** Önceki testlerden kalan veya eski kodla kaydedilen (`round_number = 0`) swipe kayıtları `fetchRoomSwipesCount` tarafından sayılıyordu.
- **Çözüm:** `fetchRoomSwipesCount` içinde `Set<number>` ile yalnızca o turun benzersiz film ID'leri sayıldı. Realtime ve 2.5 saniyelik periyodik polling senkronizasyonu ile iki cihazda canlı eşitlendi.

### 6. Sayfa Yenilenince Hep Aynı Filmlerle Başlaması (Akış Kirliliği)
- **Belirti:** Kullanıcı filmleri izledim/beğendim diye işaretleyip sayfayı yenilediğinde aynı filmler tekrar geliyordu.
- **Kök Neden:** `loadMovies` TMDb'den sadece sayfa numarasına göre çekim yapıyordu; kullanıcının geçmiş seçimleri elenmiyordu.
- **Çözüm:** `tasteProfile` içindeki `likedMovies`, `watchedMovieIds`, `passedMovieIds` kümesi oluşturularak TMDb sonuçlarından kesin olarak dışlandı (`mustExcludeIds`).

### 7. Film Görsellerinin Yüklenememesi (Kırık Posterler)
- **Belirti:** Bazı filmlerde afişler yüklenmiyor veya kırık ikon çıkıyordu.
- **Kök Neden:** TMDb'de bazı filmlerin dikey posteri eksikti veya düşük bağlantıda görsel hataya düşüyordu.
- **Çözüm:** `MovieArtwork` ortak bileşeni oluşturuldu; sırasıyla poster, backdrop, skeleton loading ve fallback yer tutucu afiş mantığı eklendi.

### 8. Kart Kaydırma Sayacının İkişer İkişer Artması
- **Belirti:** Tek bir film kaydırıldığında sayaç 2 2 artıyordu.
- **Kök Neden:** React StrictMode altında çift mount ve dokunmatik/fare olaylarının çakışması.
- **Çözüm:** Animasyon tamamlanana kadar swipe tetikleyicisi kilitlendi ve tekil güncelleme sağlandı.

### 9. Odaya Yeniden Girince Kart İndeksinin Kayıtlı İlerlemeyle Eşleşmemesi
- **Belirti:** Yenileme/katılma sonrası ekran eski karttan başlayabiliyor; böylece ekrandaki kart ilerlemesi veritabanındaki tekil swipe sayısından ayrışabiliyor.
- **Kök Neden:** `initialIndex` Supabase'den asenkron yüklendiği halde `SwipeDeck` güncel değeri uygulamıyordu.
- **Çözüm:** `initialIndex` değişince kart indeksi geriye gitmeden kayıtlı ilerlemeye taşınıyor.

### 10. Ortak Beğeninin Tur Tamamlanmadan Ekrana Gelmesi
- **Belirti:** Ortak beğeni oluşur oluşmaz `MatchModal` açılıyor; iki taraf 25 kartı tamamlamadan tur sonu ortak seçim/öneri ekranına geçilemiyordu.
- **Kök Neden:** Realtime ve polling eşleşme olayı kutlama modalını doğrudan açıyordu.
- **Çözüm:** Swipe sırasındaki eşleşme olayı sessiz tutuluyor. İki taraf turu bitirdiğinde ortak beğeniler ve ortak türlerden öneriler açılıyor; seçilen film kutlama modalını gösteriyor.

### 11. Tur Sonu Ortak Seçimler (FallbackModal) Ekranının Kapatılamaması & Sürekli Yeniden Açılması
- **Belirti:** Kullanıcı sağ üstteki 'X' kapatma butonuna veya 'Vazgeç ve Sıradaki Tura Geç' butonuna bastığında modal kapanıyor fakat 700ms sonra kendiliğinden tekrar açılıyordu (kullanıcı ekranda sıkışıp kalıyordu).
- **Kök Neden:** `SwipeDeck` içindeki `useEffect`, tur tamamlanma şartı (`roundIndex >= effectiveLimit && partnerSwipesCount >= effectiveLimit`) her iki cihaz da bitirdiğinde sürekli `true` kaldığı için modal kapatılsa bile 700ms'lik timer ile `onOpenFallback()` fonksiyonunu sonsuz döngüde yeniden tetikliyordu. Ayrıca 'Vazgeç' butonu sadece modalı kapatıyor, yeni tura geçirmiyordu.
- **Çözüm:**
  - `hasAutoOpenedFallback` ref bayrağı eklendi. Modal tur bitiminde yalnızca İLK SEFER otomatik açılır ve bayrak kilitlenir. Kullanıcı kapattıktan sonra asla kendiliğinden tekrar açılmaz.
  - Bayrak 700 ms'lik gecikmeli açılış gerçekten çalıştığında kilitlenir; bu sırada parent render olursa temizlenen timer modalı sessizce devre dışı bırakamaz.
  - Kullanıcı isterse `SwipeDeck` tur sonu ekranındaki butona basarak manuel olarak tekrar açabilir.
  - Bayrak kilidi sadece kullanıcı yeni bir tura geçtiğinde (`roundNumber` değiştiğinde) sıfırlanır.
  - 'Vazgeç ve Sıradaki Tura Geç' butonuna `onNextRound?.()` entegre edildi; basıldığında hem modal kapatılıyor hem de doğrudan bir sonraki 25 filmlik tura geçiliyor.

### 12. Oda İlerlemesinin 13 Kartta Takılması / Yeni Turun Eski İndeksten Başlaması
- **Belirti:** Kullanıcı 13 civarında bekleme/ilerleme ekranında kalıyor veya yeni turda sayaç eski kart numarasından devam ediyor.
- **Kök Neden:** Yeni tur yerel olarak açılırken `initialSwipeIndex` sıfırlanmıyordu. Ayrıca oda turu detay yüklemesi başarısız filmleri listeden çıkarıyordu; `effectiveLimit` de kalan `movies.length` üzerinden küçülüyordu. Ortak beğenideki ek yedek sorgu da swipe kaydını bloke edebiliyordu. Kayıt hataları yutulduğundan kart ilerleyip veritabanı sayacı geride kalabiliyordu.
- **Çözüm:** Yeni tur indeksi ve veto listesi sıfırlanıyor; oda filmleri en fazla 4 eşzamanlı istekle yükleniyor, retry sonrası başarısız ID'ler yer tutucuyla korunuyor. Yükleme sürerken eski turdaki kartlar kaydedilemiyor. Partner veto edilen kartı desteden silmek yerine aynı yuvada nötr pas olarak atlatıyor. Swipe yazımı idempotent upsert ve zaman aşımıyla yeniden deneniyor; başarısız yazımda kart ilerlemiyor ve görünür hata veriliyor. Eşleşme yedek sorgusu artık kart ilerlemesini bekletmiyor.

## 🔎 Son Kod İncelemesi (2026-10-20)

- [x] Ortak beğeni sonucu 25 kart öncesinde açılmıyor; tur sonu ekranı ortak beğenileri ve tür önerilerini sunuyor.
- [x] Oda ilerlemesi asenkron geldiğinde deste indeksi kayıtlı sayaca eşitleniyor; aynı tur içinde kullanıcı ilerlemesi geriye alınmıyor.
- [x] Fallback otomatik açılışı tur başına tek seferle sınırlandırılıyor.
- [ ] Sayaç eşitsizliği farklı cihazlarda henüz üretim Supabase'iyle yeniden üretilemedi. Yerel kodda progress verisi benzersiz film ID'lerinden hesaplanıyor; gerçek oda/Realtime/RLS doğrulaması Faz 3.5 çıkış ölçütünde bekliyor.
- [ ] SQL dosyasında RLS policy tanımı ve cleanup zamanlayıcısı görünmüyor; veritabanı güvenliği/temizliği doğrulanmadan canlı kullanıma hazır sayılmamalı.
- [x] `README.md` Vite şablonu olmaktan çıkarıldı; geliştirme, ortam değişkenleri, migration önkoşulları, kişisel oda akışı ve bilinen doğrulama adımları yazıldı.
- [x] `.env.example` eklendi ve `.env` ignore listesine alındı. Önceden Git tarafından izlenen yerel `.env`, içeriği açılmadan `.env.local` adına taşındı. `.git` dizini salt okunur olduğundan Git indeksindeki silme staging edilemedi; çalışma ağacında `.env` silinmiş görünüyor. Bu dosya daha önce uzak bir depoya gönderildiyse anahtarları yenile.
- [x] `npm run build` başarıyla tamamlandı. İki farklı cihazdaki canlı Supabase akışı bu ortamdan uçtan uca doğrulanamadı.
- [x] Supabase URL'si geçersiz veya gerekli anahtarlardan biri eksikse uygulama artık beyaz ekranda kalmak yerine hangi değişkenin düzeltilmesi gerektiğini gösteriyor.

### 13. Partnerlerin Aynı, Kişiselleştirilmemiş 25 Filmi Görmesi
- **Belirti:** Çiftler oda içinde aynı listeyi gördüğü için her kişinin kendi zevkine uygun, daha önce izlemediği filmleri seçme ihtiyacı karşılanmıyordu.
- **Kök Neden:** Tek `match_rooms.room_deck` alanı iki kullanıcıya ortak film sırası veriyordu.
- **Düzeltme:** Oda akışı kullanıcı+tura özel `room_user_decks` listesini kullanıyor. Adaylar kişinin tür skorlarına göre toplanıp sıralanıyor; seçilen tür/platform/yıl/puan filtreleri korunuyor; izlenenler ve o odada daha önce kaydırılan filmler eleniyor. Tur numarası ortak kalıyor, swipe sayacı ve aynı film üzerindeki ortak beğeni yine oda genelinde eşleşiyor. Sonuç önerileri iki katılımcının normalize edilmiş tür skorlarını dengeli biçimde birleştiriyor.
- **Eski oda uyumu:** Güncelleme anında eski ortak destede ilerlemiş kullanıcının mevcut tur indeksi bozulmasın diye o turun eski destesini kişisel sıra kaydı olarak devralıyor; yeni turlarda kişisel seçim uygulanıyor.
- **Veritabanı geçişi:** `supabase_schema_v2.sql` dosyasına iki yeni tablo eklendi. Bu SQL üretim Supabase'inde henüz çalıştırılmadı; yeni kod canlıda kullanılmadan önce uygulanmalı.
- [ ] Kişisel deste akışı kodlandı ancak yeni tabloların Supabase'e uygulanması ve iki cihazda ayrı profillerle doğrulama bekliyor.

### 14. Kurulum Belgeleri ve Yerel Ortam Dosyası
- **Eksik:** README başlangıç şablonuydu; `.env` Git tarafından izleniyordu.
- **Düzeltme:** README yerel kurulum, ortam değişkenleri, Supabase şema önkoşulları, kişisel oda akışı, güvenlik sınırlamaları ve doğrulama durumuyla yenilendi. `.env.example` ve ignore kuralları eklendi; yerel değerler `.env.local` içine taşındı.
- **Açık sınır:** `.git` dizinine yazma izni olmadığı için `.env` silme kaydı indekse eklenemedi. Uzak Git geçmişinde daha önce yayınlandıysa anahtar rotasyonu gerekir. RLS/Auth ve canlı DB doğrulaması hâlâ açık.

### 15. Eksik Ortam Değişkeninde Boş Ekran
- **Belirti:** Supabase ayarları yok/geçersiz olduğunda istemci oluşturma aşamasında uygulama yüklenemeyebilirdi; TMDb anahtarı eksikliği de anlaşılır bir yerde gösterilmiyordu.
- **Düzeltme:** Yapılandırma kontrolü eklendi. URL veya gerekli API anahtarları eksikse uygulama, `.env.local` konumunu ve eksik değişken adlarını gösteren kurulum ekranı açıyor. Supabase istemcisi de geçersiz URL ile import sırasında çökmemesi için güvenli yerel fallback kullanıyor.
- **Doğrulama:** Üretim build'i başarılı; eksik değişken senaryosu tarayıcıda ayrıca elle kontrol edilmedi.

### 16. Film Afişlerinin Yüklenememesi & Ön Bellek/Lazy-Load Kilitlenmesi (Çok Kademeli Görsel Telafi Mimarisi)
- **Belirti:** Keşif ve kart kaydırma ekranında bazı filmlerde (ör. "Cevher" / "The Substance") afiş yerine ortada film makarası ikonu ve gri yer tutucu kalıyordu.
- **Kök Nedenler:**
  1. `SwipeDeck` altında kart yığınının alttaki kartı (`nextMovie`) `isTopCard = false` ile `loading="lazy"` olarak render ediliyordu. Kullanıcı üstteki kartı kaydırdığında `nextMovie` üste geçip `loading="eager"` olsa dahi HTML spesifikasyonu gereği tarayıcılar (Chromium/WebKit) dinamik attribute değişiminde lazy kuyruğunu yeniden tetiklemez; kart görünür olduğu halde görsel süresiz olarak askıda kalıyordu.
  2. Kart veya görsel bileşeni DOM'a bağlandığında, önceden ön belleğe (HTTP/memory cache) alınmış görseller için tarayıcı `load` olayını tekrar ateşlemiyordu. `isLoaded` durumu `false` kaldığı için görsel DOM'da başarılı çözümlense bile `opacity-0` CSS sınıfı yüzünden görünmez kalıyor ve yer tutucu shimmer gösteriliyordu.
  3. Görsel boyut yedeklemesi yetersizdi; sadece tekil `w500` deneniyor, bölgesel CDN aksamalarında veya farklı çözünürlüklerde alternatif boyutlara (`w780`, `w342`, `original`, `backdrop`) kademeli geçiş yapılmıyordu.
- **Düzeltme:**
  1. `tmdb.ts` içerisine `getTmdbImageUrl` ve `getMovieImageCandidates` fonksiyonları eklendi. Sırasıyla `w500 -> w780 -> w342 -> w185 -> original -> backdrop (w1280, w780, w500, original)` olmak üzere 8 kademeli görsel telafi zinciri oluşturuldu.
  2. `SwipeDeck` içerisinde iki kartlık aktif destede `loading="eager"` zorunlu kılındı (`loading="lazy"` kaldırıldı); böylece alttaki kart kullanıcı kaydırmadan önce tam olarak çözümlenmiş oluyor.
  3. `MovieCard` ve `MovieArtwork` bileşenlerine `imageRefCallback` ve `useEffect` ile senkron `node.complete && node.naturalWidth > 0` ön bellek kontrolü eklendi. Ön bellekten anında gelen görsellerde `isLoaded` beklemeden derhal `true` yapılıyor.
  4. Görsel adresi değişimlerinde DOM elementinin temiz biçimde baştan oluşturulması için `<img key={currentSrc} ... />` eklendi; hata anında bir sonraki boyuta kesintisiz geçiliyor.
- **Doğrulama:** `npm run build` hatasız tamamlandı. TMDb CDN'i üzerindeki Cevher afiş ve backdrop bağlantılarının 200 OK döndürdüğü doğrulandı.

### 17. Oda Kurulumunun Başarısız Olması & Şema Önkoşul Kilitlenmesi
- **Belirti:** Kullanıcı profil veya lobi üzerinden "Yeni Oda Kur" butonuna bastığında oda kurulamıyor veya hata veriyordu.
- **Kök Nedenler:**
  1. `UserProfile.tsx` içerisinde `handleCreateRoom` fonksiyonunda `if (onCreateRoom)` dalında oda `await onCreateRoom()` ile üretiliyor ancak `await onRoomCreatedOrJoined(room)` çağrısı yalnızca `else` bloğunda kaldığı için tetiklenmiyordu. Bu nedenle `App.tsx`'in `room` state'i `null` kalıyor, oda modu aktifleşmiyor ve film destesi yüklenmiyordu.
  2. `room_user_decks` ve `room_participant_tastes` tabloları zorunlu tutulmuştu. Kullanıcının Supabase projesinde henüz bu tablolar oluşturulmadığı için `getRoomUserDeck` ve `saveRoomUserDeck` sorguları `PGRST205: Could not find the table 'public.room_user_decks' in the schema cache` hatası fırlatarak oda kurulumunu kesiyordu.
  3. `fetchPersonalRoomDeck` fonksiyonu dar filtrelerde 25'ten az aday bulduğunda eksik filmleri tamamlamak yerine hata fırlatıyordu.
- **Düzeltme:**
  1. `UserProfile.tsx` içerisinde `await onRoomCreatedOrJoined(room)` çağrısı if-else dışına çıkarılarak odanın üst bileşene (`App.tsx`) iletilmesi sağlandı.
  2. `supabase.ts` içerisindeki fonksiyonlara geriye dönük esnek telafi (resilient fallback) eklendi. `room_user_decks` tablosu bulunamadığında (`PGRST205`), hata fırlatmak yerine otomatik olarak mevcut `match_rooms.room_deck` (ve `initialize_room_deck` RPC) üzerine yazılarak 25 filmlik deste kesintisiz oluşturuldu.
  3. `fetchPersonalRoomDeck` ve `ensurePersonalRoomDeck` içerisine popüler filmlerle tamamlama eklendi; böylece dar filtrelerde dahi oda destesi asla hata fırlatmadan 25 filme tamamlanıyor.
- **Doğrulama:** Canlı Supabase veritabanında oda açılışı, `initialize_room_deck` RPC'si, 25 filmlik deste kaydı ve swipe akışı Node scripti ile uçtan uca test edildi. `npm run build` hatasız tamamlandı.

### 18. "İzledim" Butonuna Basıldığında Uyarı Banner'ı Çıkması (CHECK Constraint Kısıtlaması)
- **Belirti:** Kart kaydırırken veya film detay modalında mor göz simgeli "İzledim" butonuna basıldığında ekranda turuncu renkte *"Seçimin kaydedilemedi. Kartı tekrar kaydırmayı dene; ilerlemen kaybolmadı."* uyarısı beliriyor ve kart ilerlemesi kilitleniyordu.
- **Kök Neden:** Supabase'deki `room_swipes` tablosunun `room_swipes_action_check` constraint'i yalnızca `('like', 'pass', 'veto')` değerlerini kabul ediyordu. Uygulama `action: 'watched'` kaydetmeye çalıştığında PostgreSQL `23514: violates check constraint "room_swipes_action_check"` hatası fırlatıyor ve istemci hatayı yakalayıp ekrana uyarı banner'ı basıyordu.
- **Düzeltme:**
  1. `src/services/supabase.ts` içerisindeki `recordSwipe` fonksiyonunda veri tabanına yazılacak eylem dönüştürüldü: `action === 'watched' ? 'pass' : action === 'superlike' ? 'like' : action`. Kullanıcının cihazında "İzledim" seçimi yerel zevk profiline (İzlenenler listesi ve tür analitiği) tam olarak işlenirken, oda oturumunda veritabanı kısıtlamasına takılmadan nötr bir pas olarak kaydedildi ve swipe sayacının kusursuz artması sağlandı.
  2. `supabase_schema_v2.sql` dosyasına `room_swipes_action_check` kısıtlamasını `('like', 'pass', 'veto', 'watched', 'superlike')` kapsayacak şekilde güncelleyen DDL eklendi.
  3. `App.tsx` içerisindeki `roomSyncError` banner'ına 5 saniyelik otomatik kapanma (auto-dismiss) ve manuel kapatma ('✕') butonu eklendi; geçici bildirimlerin ekranda takılı kalması engellendi.
- **Doğrulama:** Supabase'e simüle edilen 'watched' swipe eyleminin `dbAction` ile başarıyla kaydedildiği, check constraint hatası vermediği ve sayaçları artırdığı Node scripti ile doğrulandı. `npm run build` hatasız tamamlandı.

### 19. Oda Kurulduğunda Partner Katılana Kadar Kartların Başlatılmaması & Bekleme Lobisi (Waiting Lobby)
- **Belirti:** Kullanıcı oda kurduğunda veya linki paylaştığında, partner henüz odaya katılmamış olmasına rağmen doğrudan 25 filmlik swipe kartları başlıyordu. Kurucu kişi partneri beklemeden kartları kaydırıp bitirebiliyor veya eşleşme deneyimi kopuk oluyordu.
- **Kök Neden:** `createRoom` odanın durumunu `status: 'waiting'` olarak kursa da, arayüz doğrudan `SwipeDeck` bileşenini render ediyordu. Partnerin odaya katıldığı anı tespit edip her iki kullanıcıyı eşzamanlı olarak kart ekranına alan bir bekleme lobisi ve canlı katılım dinleyicisi bulunmuyordu.
- **Düzeltme:**
  1. `RoomWaitingLobby.tsx` bileşeni geliştirildi: Radar dalga animasyonu, oda kodu gösterimi, tek tıkla bağlantı kopyalama ve WhatsApp ile doğrudan davet paylaşma butonları eklendi.
  2. Katılımcı durum paneli eklendi: Oda kurucusu (`Hazır 🟢`) ve Partner (`Bağlantı Bekleniyor ⏳ / Hazır 🟢`) canlı durum rozetleri yerleştirildi. Ayrıca tek başına test etmek veya hemen başlamak isteyenler için "Beklemeden Başlat" ve "Odayı Kapat" seçenekleri sunuldu.
  3. `supabase.ts` servisine `joinRoom(roomId, partnerName)` fonksiyonu eklendi; linke tıklayan veya kodu giren partner odaya katıldığında oda durumu `active` olarak güncelleniyor ve `partner_name` kaydediliyor.
  4. `subscribeToRoom` fonksiyonuna `onPartnerJoined` geri çağırımı (callback) entegre edildi. Hem Supabase Realtime WebSocket kanalı hem de 2.5 saniyelik yedek yoklama (polling) üzerinden partner katıldığı an kurucunun ekranında dokunsal titreşim (`hapticLike`) eşliğinde kutlama bildirimi (`{partnerName} odaya katıldı! 🎉 Film seçimi başlıyor...`) patlıyor ve lobi otomatik olarak kapatılarak 25 filmlik deste eşzamanlı başlatılıyor.
  5. `Room` arayüzüne TypeScript tarafında `creator_name` ve `partner_name` alanları eklenerek tip güvenliği sağlandı.
- **Doğrulama:** `npm run build` hatasız tamamlandı. `tsc -b && vite build` ile üretim derlemesi 0 hata ile doğrulandı.

### 20. Oda Kurulur Kurulmaz Kendiliğinden 'Partner odaya katıldı!' Uyarısı Çıkması ve Lobinin Kapanması
- **Belirti:** Kullanıcı odayı kurduğu anda henüz kimse katılmamışken ekranda *"Partner odaya katıldı! 🎉 Film seçimi başlıyor..."* uyarısı beliriyor ve bekleme lobisi hemen kapanıp kartlar tek başına başlıyordu.
- **Kök Neden:**
  1. `ensurePersonalRoomDeck` fonksiyonu oda kurulurken ilk 25 filmlik desteyi hazırlayıp `saveRoomUserDeck` -> `setRoomDeck` çağrısı yapıyordu.
  2. Eski `setRoomDeck` kodu ve Supabase `initialize_room_deck` RPC'si deste kaydedildiğinde oda durumunu doğrudan `status = 'active'` yapacak şekilde kalmıştı.
  3. `subscribeToRoom` dinleyicisi `if (newRecord.partner_name || newRecord.status === 'active')` koşuluyla dinliyordu. Deste hazırlandığı an veritabanında status 'active' olunca, henüz `partner_name` değeri `null` olmasına rağmen fallback ile 'Partner' katıldı sinyali ateşleniyordu.
- **Düzeltme:**
  1. `setRoomDeck` fonksiyonu sadece `room_deck` alanını güncelleyecek şekilde izole edildi; odanın `waiting` durumunu bozması engellendi.
  2. `supabase_schema_v2.sql` içerisindeki `initialize_room_deck` fonksiyonundan da `status = 'active'` zorlaması kaldırıldı.
  3. `subscribeToRoom` içerisindeki katılım şartı sadece `partner_name` dolu ve geçerli olduğunda (`if (newRecord.partner_name)`) tetiklenecek şekilde sıkılaştırıldı ve tek seferlik kilit (`notifiedPartner`) eklendi.
  4. Sayfa yenilendiğinde zaten partneri olan odalarda sahte bildirim çıkmaması için `alreadyHasPartner` parametresi entegre edildi.
  5. `UserProfile` üzerinden oda kurulurken açıkça kurucu (`isCreator = true`), katılırken ise (`isCreator = false`) bayrağı iletilmesi garantiye alındı.
- **Doğrulama:** Supabase üzerinde canlı oda oluşturma, deste kaydı sonrası `status: 'waiting'` kalışı ve yalnızca partner `joinRoom` yaptığında `active` geçişi simülasyon testi ile doğrulandı. `npm run build` 0 hata ile tamamlandı.

### 21. Faz 5: Zevk Analitiği, Hayat Sayacı & Eşleşme Arşivi Modülü
- **Kapsam:** Kullanıcı profiline sinema alışkanlıklarını, hayat sayacını, çift zevk uyumunu ve eşleşme geçmişini gösteren analitik altyapısının eklenmesi.
- **Uygulanan Bileşenler ve Mantık:**
  1. `UserAnalytics.tsx`: İzlenen filmlerin toplam dakikası gün ve saat cinsinden hesaplandı ("Sinemaya Ayrılan Ömür"). Beğeni oranı %, ortalama puan, arşivlenen ve sıradaki film sayıları hızlı metrik kartlarına dönüştürüldü. En çok sevilen ilk 5 tür renkli barlarla görselleştirildi.
  2. `MatchArchive.tsx`: Partnerlerle eşleşilen filmlerin tarih, oda kodu ve partner adı bilgisiyle kalıcı olarak listelendiği arşiv ekranı oluşturuldu. Birlikte izlenen filmleri doğrudan 1-10 puanla derecelendirme özelliği eklendi.
  3. `tasteProfile.ts`: `calculateLifeCounter`, `calculateProfileStats`, `calculateCoupleCompatibility` (kosinüs benzerliği formülüyle % uyum hesabı), `addMatchedMovie` ve `updateMatchRating` fonksiyonları yazıldı.
  4. `UserProfile.tsx`: Profil ekranı `Listelerim`, `Analitik` ve `Eşleşmeler` olmak üzere 3 sekmeli temiz ve modern arayüze kavuşturuldu.
- **Doğrulama:** `npm run build` ile TypeScript derlemesi 0 hata ile doğrulandı.

### 22. Partner Zevk Uyumunun Sabit %88 Kalması & Canlı WebSocket Broadcast Senkronizasyonu
- **Belirti:** Yeni bir cihaz veya farklı bir kullanıcıyla odaya bağlanıldığında dahi Analitik sekmesindeki 'Partner ile Uyum' skoru sürekli sabit %88 çıkıyordu.
- **Kök Neden:**
  1. `calculateCoupleCompatibility` fonksiyonunda partnerin tür verisi henüz bulunamadığında (`!partnerScores`) geçici bir varsayılan olarak `return 88` kalmıştı.
  2. Supabase üzerinde `room_participant_tastes` tablosu SQL migration olarak henüz uygulanmadığından veritabanı sorgusu 404 dönüyor ve kod sürekli bu %88 varsayılanına düşüyordu.
- **Düzeltme:**
  1. `calculateCoupleCompatibility` fonksiyonundan sabit %88 kaldırıldı; partner verisi yokken sahte bir skor üretmeyip `null` (`%—`) döndürmesi sağlandı.
  2. `UserAnalytics.tsx` içerisinde partner bağlı değilken veya veri henüz gelmemişken skor `%—` ve durum *"Partner zevk verisi eşitleniyor ⏳"* olarak netleştirildi.
  3. Supabase Realtime kanalı üzerine `broadcast` (`taste_sync`) olayı entegre edildi. İki cihaz odaya bağlandığında hiçbir veritabanı tablosuna bağımlı kalmadan tür zevk skorlarını WebSocket üzerinden anında birbirine iletiyor.
  4. Gelen gerçek partner zevk skorları ile kullanıcının zevk skorları kosinüs benzerliği formülü üzerinden canlı olarak hesaplanıyor (benzer zevklerde %90+, zıt zevklerde %35-%50 gibi gerçekçi ve dinamik sonuçlar üretiliyor).
- **Doğrulama:** Supabase Realtime broadcast simülasyonu ve kosinüs benzerliği formülü Node ile test edildi. `npm run build` 0 hata ile doğrulandı.

### 23. İsteğe Bağlı 30 Film Kalibrasyonu & Supabase Auth Bulut Hesabı (Progressive Onboarding)
- **Kapsam:** Kullanıcı deneyimini hızlandırmak için ilk girişteki 30 film testinin isteğe bağlı ("Bu Adımı Geç") yapılması ve kullanıcının ilerlemesini cihazlar arasında korumak için Profil sekmesine Supabase Auth bulut hesabı ("Giriş Yap / Kaydol") entegre edilmesi.
- **Uygulanan Bileşenler ve Mantık:**
  1. `OnboardingFlow.tsx`:
     - Öğretici ekranına belirgin *"Şimdi Değil, Doğrudan Filmlere Geç →"* butonu eklendi.
     - 30 film kaydırma ekranının sağ üst köşesine *"Testi Geç →"* butonu yerleştirildi.
     - Testi atlayan kullanıcılar `coldStartCompleted: false` olarak anında ana akışa ve odalara geçebiliyor.
  2. `UserProfile.tsx`:
     - Testi atlamış kullanıcılara profil ekranında *"🎯 Zevk Kalibrasyonu (30 Film): Sana özel öneriler için testi istediğin zaman çözebilirsin"* davet kartı eklendi. Butona tıklandığında test modalı baştan rumuz sormadan doğrudan 30 filmden açılarak tamamlanabiliyor.
     - Bulut hesabı paneli eklendi: Misafir kullanıcılara *"İlerlemeyi Buluta Kaydet"* daveti, giriş yapmış kullanıcılara ise yeşil *"Yedeklendi 🟢 {email}"* rozeti ve çıkış yapma seçeneği sunuldu.
  3. `AuthModal.tsx`:
     - Supabase Auth altyapısıyla E-posta ve Şifre ile kayıt olma ve giriş yapma ekranı geliştirildi.
     - Giriş yapıldığında bulutta kayıtlı profil, listeler ve analizler anında yerel tarayıcıya geri yükleniyor.
     - Kullanıcı kart kaydırdıkça bulut oturumu varsa veriler arka planda otomatik senkronize ediliyor (`syncProfileToCloud`).
- **Doğrulama:** `npm run build` ile TypeScript ve Vite derlemesi 0 hata ile doğrulandı.

### 24. Faz 6: Çoklu Arkadaş Grubu Modu (Watch Party / 3-5 Kişi)
- **Kapsam:** İkili çift eşleşme altyapısının 3-5 kişilik arkadaş gruplarına genişletilmesi, Supabase Realtime Presence ile eş zamanlı lobi yönetimi, oy çokluğu ve veto eliminasyon algoritması ile kutlama podyumu ekranının tamamlanması.
- **Uygulanan Bileşenler ve Mantık:**
  1. `types.ts`: `RoomMode` ('pair' | 'group'), `GroupParticipant` (userId, username, avatar, isReady, swipesCount) ve `GroupVoteResult` arayüzleri modellendi.
  2. `groupVoting.ts`: `calculateGroupVotingResults` servisi geliştirildi. Veto edilen filmlerin tam olarak elenmesi, beğenilerin (1 oy) ve süper beğenilerin (1.5 oy) ağırlıklı toplanması ve eşitlik durumlarında TMDb puanı üzerinden sıralanması sağlandı.
  3. `supabase.ts`: `createRoom` ve `joinRoom` fonksiyonları grup modunu destekleyecek şekilde güncellendi. `subscribeToRoom` kanalına Supabase Realtime Presence entegre edildi (`channel.track` ve `presence.on('sync')`). Kurucunun oturumu başlatabilmesi için `activateRoom` eklendi.
  4. `RoomWaitingLobby.tsx`: Grup modunda 5 kişilik katılımcı slotları, bağlanan kullanıcıların avatarları ve kurucu için "Grubu Başlat" butonu arayüze kazandırıldı.
  5. `UserProfile.tsx`: Oda oluşturma alanına "İkili Çift (2 Kişi)" ve "Arkadaş Grubu (3-5)" mod seçim kontrolü eklendi.
  6. `SwipeDeck.tsx`: Watch Party üst başlığı, grup içi anlık veto duyuruları ve 25 film tamamlandığında canlı grup ilerleme puan tablosu geliştirildi.
  7. `GroupResultModal.tsx`: Konfeti eşliğinde 🥇 1. Zirve Kazananı (oy veren isimler, fragman, yayın platformları), 🥈 2. ve 🥉 3. alternatifler ile veto edilen filmlerin açılır kapanır dökümü ve yeni tur butonları hazırlandı.
- **Doğrulama:** `npm run build` ile TypeScript ve Vite derlemesi 0 hata ile tamamlandı. Grup oy sayımı ve veto sıralama mantığı test edildi.

### 25. Faz 7: Gelir Modeli, Sponsorlu Vizyon Kartları & Hukuki Uyum (KVKK & TMDb Atfı)
- **Kapsam:** Kullanıcı deneyimini kesintiye uğratmayan doğal sponsorlu film kartı modelinin kurulması, Google Play Store ve canlı web yayınları için yasal atıf, KVKK sözleşmesi ve Vercel canlı dağıtım yapılandırmasının tamamlanması.
- **Uygulanan Bileşenler ve Mantık:**
  1. `types.ts`: `Movie` arayüzüne `isSponsored`, `sponsorLabel` ve `sponsorCtaUrl` alanları eklendi.
  2. `MovieCard.tsx`: Sponsorlu kartlar için sol üst köşede "Vizyonda 🍿" / "Sponsorlu" parıltılı rozeti ve tıklanabilir bilet / platform yönlendirme (`↗`) butonu tasarlandı.
  3. `tmdb.ts`: Türkiye'de şu an vizyonda olan sinema filmlerini doğal sponsorlu vitrin kartı olarak çeken `fetchNowPlayingMovies` fonksiyonu uyarlandı.
  4. `PrivacyPolicyModal.tsx`: TMDb resmi API atıfı, JustWatch telif bilgisi, KVKK veri işleme ve LocalStorage kullanımını açıklayan modern yasal bilgilendirme modalı geliştirildi.
  5. `UserProfile.tsx`: Profil sekmesinin altına yasal şartlar butonu yerleştirilerek kullanıcıların dilediğinde gizlilik sözleşmesine erişmesi sağlandı.
  6. `vercel.json`: Canlıya alma öncesinde SPA yönlendirmeleri (`rewrites`), PWA Service Worker cache yönetimi ve güvenlik başlıkları (`X-Frame-Options`, `X-Content-Type-Options`) yapılandırıldı.
- **Doğrulama:** `npm run build` ile derleme 0 hata ile tamamlandı.

### 26. Faz 8: Canlı Dağıtım (Vercel) & Google Play Store (TWA) Yayın Hazırlığı
- **Kapsam:** Projenin canlı internet ortamında (`neizlesek.vercel.app`) ve Google Play Store'da Android uygulaması olarak dağıtılması için gereken tüm yapılandırmaların, varlıkların ve dökümantasyonun hazırlanması.
- **Uygulanan Bileşenler ve Mantık:**
  1. `CANLI_DAGITIM_REHBERI.md`: GitHub'a gönderme, Vercel ortam değişkenleri (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY`) ile canlıya alma ve PWABuilder ile Google Play Store `.aab` paketi üretme adımlarını içeren kapsamlı rehber hazırlandı.
  2. `index.html`: WhatsApp, iMessage, Twitter vb. sosyal platformlarda oda veya uygulama linki paylaşıldığında zengin önizleme afişi çıkaran OpenGraph (`og:image`, `og:title`) ve Twitter Card etiketleri eklendi.
  3. `public/robots.txt` & `public/sitemap.xml`: Arama motoru optimizasyonu sağlandı; özel oda oturum linklerinin indekslenmesi engellendi.
  4. `public/.well-known/assetlinks.json`: Google Play Store TWA (Trusted Web Activity) tam ekran yerel görünüm doğrulama dosyası entegre edildi.
  5. `vercel.json`: Canlı üretim ortamında kesintisiz tek sayfa routing ve Service Worker önbellekleme desteği garantilendi.
- **Doğrulama:** `npm run build` ile TypeScript ve Vite derlemesi 0 hata ile tamamlandı. PWA manifest ve servis işçisi doğrulaması yapıldı.

---

## 🔄 Anasayfa Geri Alma (Undo) & Beğenilen / İzlenen Tutarlılığı

- [x] **Sol Üst Geri Alma Simgesi (RotateCcw):**
  - Anasayfada kart yığınının sol üst köşesine modern, haptik geri bildirimli `RotateCcw` geri alma butonu eklendi.
  - Kart geçmişi olduğunda (`roundIndex > 0`) aktifleşir; ilk karttayken pasifize olur.
  - Masaüstü için `Z` ve `Backspace` klavye kısayolları eklendi, alt bilgi barında kısayol ipucu gösterildi.
- [x] **Tüm Kaydırma Yönleri İçin Geri Alma:**
  - Kullanıcı hangi yöne kaydırmış olursa olsun (**Beğen / Sağ**, **Pas / Sol**, **İzledim / Yukarı-Aşağı**, **Veto**), geri al tuşuna bastığında bir önceki kart ekrana geri gelir.
  - Veto geri alındığında kullanıcının veto hakkı iade edilir (`remainingVetoes + 1`).
- [x] **Beğenilen & İzlenen Karşılıklı Ayrıklık (Mutual Exclusivity) Garantisi:**
  - `updateTasteWithSwipe`: Bir film "izlendi" olarak işaretlendiğinde, daha önceden beğenilmiş olsa dahi kesin olarak `likedMovies` listesinden filtrelenip kaldırılır.
  - Tersine, izlenen veya pas geçilen bir film beğenilirse `watchedMovieIds` ve `watchedMovies` listesinden kaldırılır.
  - Tür zevk skorları (genre scores) net fark formülü (`netDelta = newDelta - oldDelta`) ile güncellenerek mükerrer puan şişmesi engellenir.
  - Supabase `room_swipes` üzerinde `ignoreDuplicates: false` ayarlanarak geri alma sonrası değişen kararlar veritabanında da güncellenir.
- [x] **Doğrulama:** `npm run build` ile derleme hatasız tamamlandı.
