# 🗺️ Neİzlesek: Durum Özeti & Kalan Adımlar Yol Haritası

Bu belge, **Neİzlesek** projesinin şu ana kadar tamamlanan tüm aşamalarını, çözülen kritik altyapı sorunlarını ve canlıya çıkışa kadar yapılması gereken kalan fazları detaylandırmaktadır.

---

## 📊 Genel İlerleme Durumu

| Faz | Kapsam | Durum | Tamamlanma |
| :--- | :--- | :---: | :---: |
| **Faz 1** | Çekirdek Altyapı, Supabase & TMDb Eşleşme | ✅ Tamamlandı | %100 |
| **Faz 2** | 3 Sekmeli Arayüz, Filtreler & Zevk Kalibrasyonu | ✅ Tamamlandı | %100 |
| **Faz 3** | Kütüphane Yönetimi, Kart Detayı, Veto & Fallback | ✅ Tamamlandı | %100 |
| **Faz 4** | Mobil PWA, Haptic Titreşim & Cihaz Deneyimi | 🟡 **Sıradaki Faz** | %0 |
| **Faz 5** | Zevk Analitiği, Hayat Sayacı & Çift Uyumu | ⚪ Beklemede | %0 |
| **Faz 6** | Çoklu Arkadaş Grubu Modu (3-5 Kişi) | ⚪ Beklemede | %0 |
| **Faz 7** | Gelir Modeli (TMDb Lisansı, Sponsor & Reklam) | ⚪ Beklemede | %0 |
| **Faz 8** | Canlı Dağıtım (Vercel) & Google Play Store (TWA) | ⚪ Beklemede | %0 |

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
- [x] **Oda Senkronizasyonu (`room_deck`):**
  - İki cihazın aynı odaya girdiğinde **birebir aynı 25 filmi aynı sırada** görmesini sağlayan veritabanı senkronizasyonu.
- [x] **Tur Sonu Canlı Partner Bekleme Ekranı:**
  - Bir kullanıcı 25 filmi bitirdiğinde partnerin ilerlemesini canlı gösteren bekleme ekranı (`Partnerinin İlerlemesi: 18 / 25 Film`).
- [x] **Fallback Eşleşme (Boş Kesişim Çözümü):**
  - 25 film sonunda eşleşme çıkmazsa itiraz edilmeyen ve en çok yaklaşılan ilk 3 filmi oylamaya sunan kurtarma ekranı.
- [x] **Görsel Ön Yükleme (Preload) & Akıllı Telafi:**
  - Sıradaki 4 kartın afişini arka planda belleğe indirme.
  - Poster yüklenemezse `backdrop` görseline otomatik geçiş ve şık sinematik yedek kart.
- [x] **Akış Temizliği:**
  - Kullanıcının izlediği veya beğendiği filmlerin bir daha asla ana akışta karşısına çıkmaması.

---

## 🟡 Sırada Yapılacaklar (Eksikler & Yol Haritası)

### 🚀 FAZ 4: PWA ve Cihaz Deneyimi (Öncelikli Sıradaki Faz)
*Amaç: Web sitesini gerçek bir mobil uygulama hissiyatına kavuşturmak ve tarayıcı çubuğunu kaldırmak.*

1. **Web App Manifest (`manifest.json`):**
   - Uygulama adı: "Neİzlesek"
   - `display: standalone` (tarayıcı adres çubuğu ve butonları olmadan tam ekran çalışma).
   - `theme_color`: `#09090b` (zinc-950 koyu tema uyumu).
   - `orientation: portrait` (dikey mobil kilit).
2. **Mobil İkonlar & Splash Ekranı:**
   - 192x192 ve 512x512 maskable PWA ikonları (`/public` klasörüne).
   - iOS Safari için `apple-touch-icon` ve `apple-mobile-web-app-capable` meta etiketleri.
3. **Haptic Feedback (Titreşim Motoru):**
   - Sağa/sola kart kaydırıldığında ve Veto basıldığında hafif dokunsal titreşim (`navigator.vibrate(15)` - Android uyumlu, iOS Safari desteklemediği için sessiz hata yönetimi).
4. **Service Worker & Çevrimdışı Temel Önbellek:**
   - `vite-plugin-pwa` ile internet yavaşken bile anında açılan offline kabuk (shell).
5. **Kapalı Test Başlangıcı:**
   - Play Store'un 12 kişilik 14 gün test şartı için bu aşamada yakın arkadaş çevresine link verilip denemelere başlanması.

---

### 📊 FAZ 5: Zevk Analitiği & İstatistik Günlüğü
*Amaç: Kullanıcıya izleme alışkanlıklarını göstererek bağlılığı (retention) artırmak.*

1. **Hayat Sayacı:**
   - "Bugüne kadar hayatının 4 günü, 18 saatini film izleyerek geçirdin." (İzlenen filmlerin sürelerinin toplamı).
2. **Çift Uyumu Yüzdesi & Eşleşme Arşivi:**
   - "Partnerinle %82 oranında film zevki uyumuna sahipsiniz."
   - "Birlikte bugüne kadar 9 film eşleştiniz." (Geçmiş eşleşmeler arşivi).
3. **Tür & Yönetmen Grafikleri:**
   - En çok izlediğin ilk 3 film türü ve en sevdiğin yönetmenlerin dağılımı.
4. **Eşleşen Filmi Birlikte Puanlama:**
   - Eşleşilen filmi izledikten sonra iki tarafın da filme verdiği puanların ortak profilde tutulması.

---

### 👥 FAZ 6: Çoklu Arkadaş Grubu Modu (Watch Party / 3-5 Kişi)
*Amaç: İkili çift modunu 3-5 kişilik arkadaş gruplarına genişletmek.*

1. **Grup Odaları:**
   - Odaya 2'den fazla kişinin (3-5 kişi) aynı kodla bağlanabilmesi.
2. **Oy Çokluğu Algoritması:**
   - Herkes 20 kart kaydırır; sistem en çok oyu alan veya kimsenin veto etmediği filmi birinci seçer.

---

### 💰 FAZ 7: Gelir Modeli & Hukuki Hazırlık
*Amaç: Kullanıcı deneyimini bozmadan sürdürülebilir gelir elde etmek.*

1. **TMDb Ticari Lisans Başvurusu:**
   - Reklam veya affiliate bağlantısı eklemeden önce TMDb'den yazılı ticari onay alınması zorunludur.
2. **Reklam Stratejisi Netleştirmesi:**
   - *Önemli Teknik Bilgi:* AdMob doğrudan PWA/TWA içinde çalışmaz.
   - Seçenek A: Web AdSense (içerik metni az olduğu için reddedilme riski var).
   - Seçenek B: Native sarmalayıcı (Capacitor/Cordova) ile gerçek Google AdMob SDK.
3. **Yayıncı Ortaklık Linkleri (Affiliate Deep Links):**
   - Prime Video / Apple TV kiralama ve satın alma bağlantılarından komisyon.
4. **Sponsorlu Vizyon Kartları (En Gerçekçi Gelir):**
   - Her 25 filmde bir, vizyona yeni giren yerli/yabancı sinema filminin doğal sponsorlu afişi.

---

### 🌐 FAZ 8: Canlı Dağıtım & Mağaza Yayınları
*Amaç: Projeyi gerçek dünyaya açmak.*

1. **Vercel Canlı Dağıtım:**
   - `neizlesek.app` veya ücretsiz `neizlesek.vercel.app` alan adı ile canlıya alma.
   - Ortam değişkenleri (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY`) Vercel paneline girilir.
2. **Google Play Store (TWA - Trusted Web Activity):**
   - Bubblewrap veya PWABuilder kullanılarak sıfır ek kodla Android APK/AAB paketi üretilmesi.
   - Google Play Console ($25 tek seferlik hesap ücreti).
   - 12 test kullanıcısı ile 14 günlük kapalı test sürecinin tamamlanıp yayına sunulması.

---

## 📌 Sıradaki Önerilen Aksiyon

**Faz 4: PWA (Mobil Uygulama Hissi & İkonlar) Kurulumu.**
`vite-plugin-pwa` entegrasyonu, `manifest.json`, tam ekran mobil görünüm ve haptic titreşim efektleri eklenerek uygulama doğrudan telefona yüklenebilir hale getirilecektir.
