DROP TRIGGER IF EXISTS trg_clubs_add_owner ON public.clubs;
CREATE TRIGGER trg_clubs_add_owner
  AFTER INSERT ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.tg_club_add_owner();

INSERT INTO public.club_members (club_id, user_id, role)
SELECT c.id, c.created_by, 'owner'
FROM public.clubs c
WHERE c.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.club_members cm
    WHERE cm.club_id = c.id AND cm.user_id = c.created_by
  )
ON CONFLICT (club_id, user_id) DO NOTHING;