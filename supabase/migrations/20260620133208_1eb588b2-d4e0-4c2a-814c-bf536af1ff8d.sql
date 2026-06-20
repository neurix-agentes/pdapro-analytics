ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sessions ALTER COLUMN status SET DEFAULT 'pending'::public.session_status;