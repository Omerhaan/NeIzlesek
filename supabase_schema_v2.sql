-- =========================================================================
-- Neİzlesek: Faz 3.0 & 3.1 Supabase Şema & Tetikleyici Güncellemesi (v2)
-- =========================================================================

-- 1. Oda turlarını ve swipe kayıtlarını ayır.
-- Eski swipe kayıtları 0 kalır; geçmiş ilerleme ilk yeni turun sayacına eklenmez.
ALTER TABLE public.match_rooms
  ADD COLUMN IF NOT EXISTS round_number integer NOT NULL DEFAULT 1;

ALTER TABLE public.match_rooms
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

ALTER TABLE public.room_swipes
  ADD COLUMN IF NOT EXISTS round_number integer NOT NULL DEFAULT 0;

-- İstemci room_swipes.user_name alanını kullanıcı kimliği olarak kullanır.
-- Aynı kullanıcının aynı turda aynı filme iki kez swipe atmasını engeller.
ALTER TABLE public.room_swipes
  DROP CONSTRAINT IF EXISTS unique_room_user_movie;

ALTER TABLE public.room_swipes
  ADD CONSTRAINT unique_room_user_movie UNIQUE (room_id, user_name, movie_id, round_number);

-- İstemciden gelen ek eylemleri (watched, superlike) veri tabanı seviyesinde kabul et
ALTER TABLE public.room_swipes
  DROP CONSTRAINT IF EXISTS room_swipes_action_check;

ALTER TABLE public.room_swipes
  ADD CONSTRAINT room_swipes_action_check CHECK (action IN ('like', 'pass', 'veto', 'watched', 'superlike'));

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
    SELECT status, round_number INTO current_room FROM public.match_rooms WHERE id = NEW.room_id;
    IF current_room.status = 'matched' THEN
      RETURN NEW;
    END IF;

    IF NEW.round_number != current_room.round_number THEN
      RETURN NEW;
    END IF;

    -- Odadaki diğer kullanıcının bu filme 'like' verip vermediğini sorgula
    SELECT * INTO partner_swipe 
    FROM public.room_swipes
    WHERE room_id = NEW.room_id 
      AND movie_id = NEW.movie_id 
      AND round_number = NEW.round_number
      AND user_name != NEW.user_name
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

-- 3. İlk desteği tek seferde kaydet. Erken katılan cihazlar da aynı desteyi alır.
CREATE OR REPLACE FUNCTION public.initialize_room_deck(
  p_room_id uuid,
  p_movie_ids integer[]
)
RETURNS TABLE(room_deck integer[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1
  FROM public.match_rooms AS mr
  WHERE mr.id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room % does not exist', p_room_id;
  END IF;

  UPDATE public.match_rooms AS mr
  SET room_deck = p_movie_ids,
      updated_at = NOW()
  WHERE mr.id = p_room_id
    AND (mr.room_deck IS NULL OR cardinality(mr.room_deck) = 0);

  RETURN QUERY
  SELECT mr.room_deck
  FROM public.match_rooms AS mr
  WHERE mr.id = p_room_id;
END;
$$;

-- 4. Atomik tur ilerletme: aynı anda iki cihaz isterse ilk yazılan deste kazanır.
CREATE OR REPLACE FUNCTION public.advance_room_round(
  p_room_id uuid,
  p_expected_round integer,
  p_movie_ids integer[]
)
RETURNS TABLE(round_number integer, room_deck integer[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_round integer;
BEGIN
  SELECT mr.round_number INTO current_round
  FROM public.match_rooms AS mr
  WHERE mr.id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room % does not exist', p_room_id;
  END IF;

  IF current_round = p_expected_round THEN
    UPDATE public.match_rooms AS mr
    SET round_number = current_round + 1,
        room_deck = p_movie_ids,
        status = 'active',
        matched_movie_id = NULL,
        updated_at = NOW()
    WHERE mr.id = p_room_id;
  END IF;

  RETURN QUERY
  SELECT mr.round_number, mr.room_deck
  FROM public.match_rooms AS mr
  WHERE mr.id = p_room_id;
END;
$$;

-- Fonksiyon izinlerini tanımla (anon ve authenticated kullanıcılar RPC ile çağırabilsin)
GRANT EXECUTE ON FUNCTION public.initialize_room_deck(uuid, integer[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.advance_room_round(uuid, integer, integer[]) TO anon, authenticated, service_role;

-- 5. Süresi Dolmuş Odaları Temizleme Fonksiyonu (7 Gün)
-- Supabase Free Tier sınırlarını korumak için 7 günden eski odaları ve swipe'ları siler.
CREATE OR REPLACE FUNCTION public.cleanup_old_match_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM public.match_rooms
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Kişiye özel oda desteleri ve ortak öneri için asgari zevk özeti.
-- Uygulamayı güncellerken bu dosyayı Supabase SQL Editor'da yeniden çalıştırın.
CREATE TABLE IF NOT EXISTS public.room_user_decks (
  room_id uuid NOT NULL REFERENCES public.match_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  round_number integer NOT NULL,
  movie_ids integer[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id, round_number),
  CHECK (cardinality(movie_ids) = 25)
);

CREATE TABLE IF NOT EXISTS public.room_participant_tastes (
  room_id uuid NOT NULL REFERENCES public.match_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  genre_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  watched_movie_ids integer[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.room_user_decks TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.room_participant_tastes TO anon, authenticated, service_role;

-- 7. RLS Politikaları (Hem anon hem authenticated kullanıcılar için)
ALTER TABLE public.match_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to match_rooms for anon and authenticated" ON public.match_rooms;
CREATE POLICY "Allow all access to match_rooms for anon and authenticated"
ON public.match_rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.room_swipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to room_swipes for anon and authenticated" ON public.room_swipes;
CREATE POLICY "Allow all access to room_swipes for anon and authenticated"
ON public.room_swipes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.room_user_decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to room_user_decks for anon and authenticated" ON public.room_user_decks;
CREATE POLICY "Allow all access to room_user_decks for anon and authenticated"
ON public.room_user_decks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.room_participant_tastes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to room_participant_tastes for anon and authenticated" ON public.room_participant_tastes;
CREATE POLICY "Allow all access to room_participant_tastes for anon and authenticated"
ON public.room_participant_tastes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.match_rooms TO anon, authenticated, service_role;
GRANT ALL ON public.room_swipes TO anon, authenticated, service_role;
GRANT ALL ON public.room_user_decks TO anon, authenticated, service_role;
GRANT ALL ON public.room_participant_tastes TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
