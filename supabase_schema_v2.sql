-- =========================================================================
-- Neİzlesek: Faz 3.0 & 3.1 Supabase Şema & Tetikleyici Güncellemesi (v2)
-- =========================================================================

-- 1. room_swipes tablosuna Veto aksiyonu ve Çift Kayıt (Race Condition) Koruması
-- Aynı kullanıcının aynı filme aynı odada 2 kez swipe atmasını engeller.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_room_user_movie'
  ) THEN
    ALTER TABLE public.room_swipes 
    ADD CONSTRAINT unique_room_user_movie UNIQUE (room_id, user_id, movie_id);
  END IF;
END $$;

-- 2. Race-Condition ve Çift Eşleşme Önleyici Trigger (trg_check_match)
-- İki kullanıcı aynı anda 'like' atsa bile sadece tek bir eşleşme oluşur (status != 'matched' kontrolü ile).
CREATE OR REPLACE FUNCTION public.check_room_match()
RETURNS TRIGGER AS $$
DECLARE
  partner_swipe RECORD;
  current_room RECORD;
BEGIN
  -- Yalnızca 'like' aksiyonlarında eşleşme kontrol edilir (veto veya pass kontrol edilmez)
  IF NEW.action = 'like' THEN
    -- Oda zaten eşleşmiş mi kontrol et
    SELECT status INTO current_room FROM public.match_rooms WHERE id = NEW.room_id;
    IF current_room.status = 'matched' THEN
      RETURN NEW;
    END IF;

    -- Odadaki diğer kullanıcının bu filme 'like' verip vermediğini sorgula
    SELECT * INTO partner_swipe 
    FROM public.room_swipes
    WHERE room_id = NEW.room_id 
      AND movie_id = NEW.movie_id 
      AND user_id != NEW.user_id 
      AND action = 'like'
    LIMIT 1;

    -- Eğer diğer kullanıcı da beğenmişse odayı 'matched' durumuna güncelle
    IF FOUND THEN
      UPDATE public.match_rooms
      SET 
        status = 'matched',
        matched_movie_id = NEW.movie_id,
        updated_at = NOW()
      WHERE id = NEW.room_id AND status != 'matched';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tetikleyiciyi oluştur (Öncesi varsa kaldırıp yeniden kur)
DROP TRIGGER IF EXISTS trg_check_match ON public.room_swipes;
CREATE TRIGGER trg_check_match
AFTER INSERT OR UPDATE ON public.room_swipes
FOR EACH ROW
EXECUTE FUNCTION public.check_room_match();

-- 3. Süresi Dolmuş Odaları Temizleme Fonksiyonu (7 Gün)
-- Supabase Free Tier sınırlarını korumak için 7 günden eski odaları ve swipe'ları siler.
CREATE OR REPLACE FUNCTION public.cleanup_old_match_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM public.match_rooms
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
