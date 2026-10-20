# 🗺️ Neİzlesek: Durum Özeti & Kalan Adımlar Yol Haritası

Bu belge, **Neİzlesek** projesinin mevcut özelliklerini ve canlıya çıkışa kadar yapılması gereken işleri özetler. Tamamlandı işaretleri özelliklerin kodda bulunduğunu gösterir; üretim veritabanında ve iki ayrı cihazda uçtan uca doğrulandıkları anlamına gelmez. Faz 3.5, bu doğrulamaları ve önceki incelemede görülen oda akışı eksiklerini ele alır.

---

## 📊 Genel İlerleme Durumu

| Faz | Kapsam | Durum | Tamamlanma |
| :--- | :--- | :---: | :---: |
| **Faz 1** | Çekirdek Altyapı, Supabase & TMDb Eşleşme | ✅ Tamamlandı | %100 |
| **Faz 2** | 3 Sekmeli Arayüz, Filtreler & Zevk Kalibrasyonu | ✅ Tamamlandı | %100 |
| **Faz 3** | Kütüphane Yönetimi, Kart Detayı, Veto & Fallback | ✅ Tamamlandı | %100 |
| **Faz 3.5** | Oda Akışı Güvenilirliği & Canlıya Hazırlık | 🟡 **Öncelikli** | %0 |
| **Faz 4** | Mobil PWA, Haptic Titreşim & Cihaz Deneyimi | ⚪ Beklemede | %0 |
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

### 🧰 FAZ 3.5: Oda Akışı Güvenilirliği & Canlıya Hazırlık (Öncelikli)
*Amaç: PWA ve kapalı test öncesinde ortak oda akışının şema, tur ve senkronizasyon sorunlarını gidermek; dağıtım için temel işletim hazırlığını tamamlamak.*

1. **Supabase şemasını istemciyle eşleştir:** `room_swipes` için `user_name` / `user_id` alanlarından birini standartlaştır; benzersiz kısıt, eşleşme tetikleyicisi ve istemci sorgularını aynı alana göre güncelle. SQL geçişini mevcut veriyi koruyacak ve tekrar çalıştırılabilecek şekilde hazırla.
2. **Tur boyutunu tutarlı hale getir:** TMDb sayfa başına en fazla 20 sonuç döndürürken oda akışının 25 swipe beklemesini düzelt. Ya 25 filme tamamlanan bir deste üret ya da tur hedefini kaydedilmiş destenin gerçek uzunluğuna bağla. Boş/eksik deste için anlaşılır durum göster.
3. **Tek kaynaktan oda destesi üret:** Yeni tur destesini bir kez üretip Supabase'e kaydet; diğer katılımcılar aynı `room_deck` listesini ve sıralamasını yüklesin. İki cihazla oda oluşturma, katılma, yeni tur ve filtre akışlarını doğrula.
4. **Eşleşme ve sayaç bildirimlerini tekilleştir:** Polling ve Realtime aynı olayı bildirdiğinde eşleşme modalı yalnızca bir kez açılsın. Partner swipe sayacı mevcut turla sınırlı kalsın; tur değişiminde eski swipe kayıtları yeni turun ilerlemesine eklenmesin.
5. **Veritabanı erişimini ve oda yaşam döngüsünü gözden geçir:** RLS/policy kurallarını anon kullanıcı modeliyle kontrol et; oda kodu, katılım, swipe, veto, eşleşme ve eski oda temizliği için beklenen izinleri tanımla. Temizlik fonksiyonunun gerçekten zamanlanıp zamanlanmadığını ve bağlı swipe kayıtlarının silinme davranışını doğrula.
6. **Yapılandırma ve hata durumlarını belgele:** README'ye kurulum, gerekli ortam değişkenleri, Supabase şema kurulumu ve dağıtım adımlarını ekle. Eksik API anahtarı, ağ hatası ve boş sonuç durumlarını kullanıcıya ayırt edilir biçimde göster.
7. **Çıkış ölçütü:** İki ayrı tarayıcı/cihazla aynı odayı açıp aynı desteyi aynı sırada görmek; swipe, veto, tur sonu, fallback ve eşleşmeyi doğrulamak; ardından üretim build'ini ve veritabanı policy'lerini kontrol etmek.

### 🚀 FAZ 4: PWA ve Cihaz Deneyimi
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
5. **Arkadaşlarla web/PWA pilotu:**
   - Faz 3.5 çıkış ölçütleri tamamlandıktan sonra davetli kullanıcılarla kurulum, çevrimdışı açılış ve mobil kullanım deneyimini gözlemle. Play Store kapalı testini mağaza yayını hazırlığına bırak.

---

### 📊 FAZ 5: Zevk Analitiği & İstatistik Günlüğü
*Amaç: Kullanıcıya izleme alışkanlıklarını göstererek bağlılığı (retention) artırmak.*

*Veri önkoşulu: Mevcut zevk profili tarayıcıdaki `localStorage` içinde tutuluyor. Cihazlar arası kişisel/ortak istatistik ve eşleşme arşivi için kimlik, saklama, senkronizasyon ve gizlilik tercihleri ayrıca tasarlanmalı. Bu altyapı kararı verilmeden ortak uyum yüzdesi veya geçmiş eşleşmeler tamamlanmış veri gibi gösterilmemeli.*

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

1. **Yayın öncesi güncel gereklilikleri doğrula:**
   - TMDb atıf/ticari kullanım şartlarını, Google Play kapalı test koşullarını ve hesap ücretlerini yayın tarihinde resmi kaynaklardan kontrol et; bu maddelerdeki sayıları sabit varsayma.
2. **Vercel Canlı Dağıtım:**
   - `neizlesek.app` veya ücretsiz `neizlesek.vercel.app` alan adı ile canlıya alma.
   - Ortam değişkenleri (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_API_KEY`) Vercel paneline girilir.
3. **Google Play Store (TWA - Trusted Web Activity):**
   - Bubblewrap veya PWABuilder kullanılarak sıfır ek kodla Android APK/AAB paketi üretilmesi.
   - Google Play Console ($25 tek seferlik hesap ücreti).
   - 12 test kullanıcısı ile 14 günlük kapalı test sürecinin tamamlanıp yayına sunulması.

---

## 📌 Sıradaki Önerilen Aksiyon

**Faz 3.5: Oda akışı güvenilirliğini ve canlıya hazırlığı tamamla.**
Önce Supabase alan uyumsuzluğunu ve 25 film/tur hedefi çelişkisini gider; ardından iki cihazlı oda senkronizasyonunu, erişim kurallarını ve hata durumlarını doğrula. Bu çıkış ölçütleri karşılandıktan sonra Faz 4 PWA çalışmasına ve davetli mobil pilota geç.
