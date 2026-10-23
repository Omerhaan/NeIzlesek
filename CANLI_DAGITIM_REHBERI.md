# 🚀 Neİzlesek: Canlı Dağıtım & Google Play Store Yayın Rehberi

Bu rehber, **Neİzlesek** uygulamasını canlı internet ortamına (Vercel) almanız ve ardından Google Play Store için Android paketine (TWA / APK / AAB) dönüştürmeniz için adım adım hazırlanmıştır.

---

## 1. Adım: Kodları GitHub'a Gönderme (Push)

Projenizdeki son güncellemeleri GitHub deponuza gönderin:

```bash
git add .
git commit -m "feat: complete Phase 6-8 Watch Party, monetization & production deployment"
git push origin master
```

---

## 2. Adım: Vercel ile Canlı Web Sitesine Alma (2 Dakika)

1. Tarayıcınızda [vercel.com](https://vercel.com) adresine gidin ve **GitHub hesabınızla** giriş yapın.
2. Sağ üstteki **"Add New..."** butonuna tıklayıp **"Project"** seçin.
3. GitHub depolarınız listelenecektir; **Neİzlesek** deponuzun yanındaki **"Import"** butonuna tıklayın.
4. **Environment Variables (Ortam Değişkenleri)** bölümünü açın ve `.env` dosyanızdaki 3 değişkeni ekleyin:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
   - `VITE_TMDB_API_KEY` = `your-tmdb-api-key`
5. **"Deploy"** butonuna basın.
6. Yaklaşık 45-60 saniye içinde uygulamanız **`https://neizlesek.vercel.app`** (veya belirleyeceğiniz özel bir domain) adresinde canlıya çıkacaktır! 🎉

> [!NOTE]
> Projede yer alan [`vercel.json`](file:///C:/Users/omerh/OneDrive/Masaüstü/Projelerim/NeIzlesek/vercel.json) dosyası, tek sayfa yönlendirmelerini (SPA routing), PWA Service Worker önbelleğini ve güvenlik başlıklarını otomatik olarak yönetir.

---

## 3. Adım: Google Play Store (TWA / Android Paketi)

Neİzlesek, %100 uyumlu bir PWA (Progressive Web App) olarak kodlandığı için sıfır ek kodla **Google Trusted Web Activity (TWA)** formatında Android uygulamasına dönüştürülür.

### Yöntem: PWABuilder ile 1 Tıkla AAB/APK Üretme

1. [pwabuilder.com](https://www.pwabuilder.com) adresine gidin.
2. Vercel canlı URL'nizi girin: `https://neizlesek.vercel.app` ve **"Start"** butonuna tıklayın.
3. PWABuilder manifest, service worker ve güvenlik puanınızı analiz eder (PWA puanınız 100/100 çıkacaktır).
4. Sağ üstteki **"Package for Store"** butonuna, ardından **"Google Play"** seçeneğine tıklayın.
5. Açılan formda:
   - **Package ID:** `app.vercel.neizlesek.twa` (veya `com.neizlesek.app`)
   - **App Name:** `Neİzlesek`
   - **Launcher Name:** `Neİzlesek`
   - **Theme color / Background color:** `#09090b`
   - **Display Mode:** `Standalone`
6. **"Generate"** butonuna basarak Google Play için imzalı `.aab` (Android App Bundle) paketini ve imza anahtarınızı (keystore) indirin.

---

## 4. Adım: Google Play Console Başvurusu

1. [play.google.com/console](https://play.google.com/console) adresine gidin ($25 tek seferlik geliştirici hesap ücreti bulunur).
2. Yeni uygulama oluşturun: **Neİzlesek - Bu Akşam Ne İzlesek?**
3. İndirdiğiniz `.aab` dosyasını **Üretim (Production)** veya **Kapalı Test (Closed Testing)** bölümüne yükleyin.
4. **Gizlilik Politikası URL'si** istendiğinde:
   - `https://neizlesek.vercel.app/` adresini girin (uygulamanızın Profil sekmesinde yerleşik gizlilik sözleşmesi mevcuttur).
5. Google'ın yeni politikası gereği 12 test kullanıcısı ile 14 günlük kapalı test sürecini tamamlayıp uygulamanızı tüm dünyaya yayınlayın.

---

## 5. Adım: Dijital Varlık Doğrulaması (assetlinks.json)

Google Play Store'dan yüklenen uygulamanın üstündeki tarayıcı adres çubuğunun tamamen kaybolması ve %100 yerel (native) Android görünümü alması için:
1. Google Play Console -> **Uygulama İmzası (App Signing)** bölümündeki **SHA-256 sertifika parmak izinizi** kopyalayın.
2. Projedeki [`public/.well-known/assetlinks.json`](file:///C:/Users/omerh/OneDrive/Masaüstü/Projelerim/NeIzlesek/public/.well-known/assetlinks.json) dosyasındaki `REPLACE_WITH_YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT` yerine yapıştırın ve Vercel'e push edin.
