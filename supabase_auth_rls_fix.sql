-- =========================================================================
-- Neİzlesek: Supabase Auth & RLS (Row Level Security) Fix
-- Bu scripti Supabase Dashboard -> SQL Editor içinde çalıştırın.
-- Hem anonim (misafir) hem de giriş yapmış (authenticated) kullanıcıların
-- oda kurabilmesini, katılabilmesini ve film kaydedebilmesini sağlar.
-- =========================================================================

-- 1. match_rooms RLS
ALTER TABLE public.match_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to match_rooms" ON public.match_rooms;
DROP POLICY IF EXISTS "Allow all access to match_rooms for anon and authenticated" ON public.match_rooms;
CREATE POLICY "Allow all access to match_rooms for anon and authenticated"
ON public.match_rooms
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. room_swipes RLS
ALTER TABLE public.room_swipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to room_swipes" ON public.room_swipes;
DROP POLICY IF EXISTS "Allow all access to room_swipes for anon and authenticated" ON public.room_swipes;
CREATE POLICY "Allow all access to room_swipes for anon and authenticated"
ON public.room_swipes
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. room_user_decks RLS
ALTER TABLE public.room_user_decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to room_user_decks" ON public.room_user_decks;
DROP POLICY IF EXISTS "Allow all access to room_user_decks for anon and authenticated" ON public.room_user_decks;
CREATE POLICY "Allow all access to room_user_decks for anon and authenticated"
ON public.room_user_decks
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. room_participant_tastes RLS
ALTER TABLE public.room_participant_tastes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to room_participant_tastes" ON public.room_participant_tastes;
DROP POLICY IF EXISTS "Allow all access to room_participant_tastes for anon and authenticated" ON public.room_participant_tastes;
CREATE POLICY "Allow all access to room_participant_tastes for anon and authenticated"
ON public.room_participant_tastes
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Yetkileri eksiksiz tanımla
GRANT ALL ON public.match_rooms TO anon, authenticated, service_role;
GRANT ALL ON public.room_swipes TO anon, authenticated, service_role;
GRANT ALL ON public.room_user_decks TO anon, authenticated, service_role;
GRANT ALL ON public.room_participant_tastes TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
