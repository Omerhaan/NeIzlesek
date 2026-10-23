# Neİzlesek

Neİzlesek, kullanıcıların film zevklerine göre film keşfetmesini ve bir odada partnerleriyle ne izleyeceklerine karar vermesini sağlayan React + TypeScript uygulamasıdır. Oda turlarında her katılımcı kendi izleme geçmişine ve zevk profiline göre ayrı bir 25 filmlik deste alır. Tur sonunda iki tarafın da beğendiği filmler ve ortak zevke göre öneriler gösterilir.

## Geliştirme ortamı

- Node.js ve npm
- Supabase projesi
- TMDb API anahtarı

Bağımlılıkları kurup geliştirme sunucusunu başlatın:

```bash
npm install
npm run dev
```

Üretim derlemesi:

```bash
npm run build
npm run preview
```

## Ortam değişkenleri

Proje kökünde `.env` oluşturun:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Vite `VITE_` önekli değerleri tarayıcı paketine dahil eder. Supabase anon/publishable anahtarı ve TMDb anahtarı istemcide gizli kabul edilmemelidir; Supabase yetkileri RLS ile sınırlandırılmalı, TMDb kullanım/limitleri izlenmelidir. `service_role` anahtarını hiçbir zaman `.env` içine `VITE_` önekiyle koymayın veya tarayıcıya göndermeyin.

`.env` Git tarafından izlenmez. Yeni kurulumlarda `.env.example` dosyasını kopyalayın ve kendi değerlerinizi yerel `.env` dosyasına ekleyin.

## Supabase veritabanı

`supabase_schema_v2.sql`, mevcut temel oda tablolarını güncelleyip oda turu/swipe kısıtlarını, eşleşme tetikleyicisini ve kişisel deste/zevk tablolarını kuran bir migration dosyasıdır. **Sıfırdan Supabase veritabanı oluşturmaz.** `match_rooms` ve `room_swipes` temel tablolarının önceden kurulmuş olması gerekir. Dosyayı Supabase Dashboard → **SQL Editor** içinde, doğru proje seçiliyken çalıştırın. Mevcut üretim veritabanında çalıştırmadan önce yedek alın ve değişiklikleri önce ayrı bir test projesinde deneyin.

Migration sonrası temel tablolar ve kolonlar şunlardır:

- `match_rooms`: oda kodu, durum, eşleşen film, tur numarası ve eski odalar için `room_deck` alanı.
- `room_swipes`: oda, tarayıcıdaki kullanıcı kimliği (`user_name`), film, aksiyon ve tur.
- `room_user_decks`: her oda/kullanıcı/tur için o kişinin sıralı 25 film ID'si.
- `room_participant_tastes`: sonuç önerileri için oda katılımcısının tür skorları ve izlenen film ID'leri.

Beklenen temel kolonlar: `match_rooms.id` (uuid), `room_code`, `status`, `matched_movie_id`, `room_deck`, `created_at`; `room_swipes.id`, `room_id`, `user_name`, `movie_id`, `action`, `created_at`. SQL dosyasındaki `CREATE TABLE IF NOT EXISTS` ifadeleri mevcut tablonun eksik kolonlarını tamamlamaz. Eski/özelleştirilmiş bir şema kullanıyorsanız önce tablolarınızı dosyadaki beklentilerle karşılaştırın.

### Güvenlik ve oda temizliği durumu

Uygulama oda katılımcısını Supabase Auth hesabıyla değil, tarayıcıda saklanan bir kimlikle tanımlar. Bu kimlik istemci tarafından gönderildiği için tek başına güvenilir kimlik doğrulama değildir. Mevcut SQL'de oda tablolarına yönelik tamamlanmış RLS politikaları yoktur; bu nedenle bu kurulum **özel veya hassas veriler için üretime hazır sayılmaz**. İnternete açık dağıtımdan önce Supabase Auth (anonim oturum dahil) ve kullanıcı kimliğine bağlı RLS politikaları tasarlanıp doğrulanmalıdır.

`cleanup_old_match_rooms()` yedi günden eski odaları siler; silme zinciri `room_swipes`, `room_user_decks` ve `room_participant_tastes` için yabancı anahtar `ON DELETE CASCADE` davranışına bağlıdır. SQL dosyası bir cron/scheduler işi kurmaz. Otomatik temizlik isteniyorsa Supabase Cron/pg_cron içinde ayrıca zamanlama yapılmalı ve test edilmelidir.

## Oda akışı

1. Oda sahibi odayı kurar, partner oda koduyla katılır.
2. Her cihaz kendi profilini kullanarak 25 izlenmemiş filmi bulur. Kullanıcının tür skorları aday sıralamasını etkiler; seçili tür, platform, yıl ve puan filtreleri uygulanır.
3. Kişisel deste oda/kullanıcı/tur anahtarıyla Supabase'e kaydedilir. Oda yalnızca turu, ilerleme sayaçlarını, veto ve ortak beğeni sonuçlarını senkronize eder.
4. İki taraf turu tamamladığında ortak beğeniler ve ortak tür skorlarına dayanan öneriler açılır.

Eski bir ortak desteli odada tur içinde ilerleme varsa, istemci o turun sırasını korumak için eski desteyi kişisel kayıt olarak devralır. Sonraki turlar kişiye özel hazırlanır.

## Bilinen doğrulama adımları

- `npm run build` TypeScript kontrolü ve Vite üretim derlemesini çalıştırır.
- Yeni kişisel deste tabloları canlı Supabase'e uygulanmadan yeni oda akışı çalışmaz.
- İki ayrı tarayıcı/cihazla farklı profiller, kişisel 25'li desteler, sayaç, veto, tur değişimi, ortak beğeni ve ortak öneriler ayrıca doğrulanmalıdır.
- Canlı oda testi yapılırken iki hesabın/tarayıcının da güncel dağıtımı kullandığını ve doğru Supabase projesine bağlandığını kontrol edin.

Güncel geliştirme durumu ve açık işler için [`KALAN_ADIMLAR.md`](./KALAN_ADIMLAR.md) dosyasına bakın.
