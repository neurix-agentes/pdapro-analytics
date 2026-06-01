
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'club_owner', 'coach', 'athlete');
CREATE TYPE public.club_role AS ENUM ('owner', 'admin', 'coach', 'member');
CREATE TYPE public.session_type AS ENUM ('treino', 'jogo', 'amistoso', 'avaliacao');
CREATE TYPE public.session_status AS ENUM ('processed', 'processing', 'queued', 'failed');
CREATE TYPE public.position_enum AS ENUM ('GK','DEF','LB','RB','CB','MID','CM','DM','AM','WING','FW','ST');
CREATE TYPE public.field_surface AS ENUM ('natural', 'sintetico', 'society');

-- ============= UTIL: updated_at trigger =============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= USER ROLES (global) =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============= CLUBS =============
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  primary_color TEXT DEFAULT '#00FF88',
  secondary_color TEXT DEFAULT '#0A2540',
  description TEXT,
  logo_url TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- ============= CLUB MEMBERS =============
CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.club_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_members TO authenticated;
GRANT ALL ON public.club_members TO service_role;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Security definer to check membership without recursion
CREATE OR REPLACE FUNCTION public.is_club_member(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.club_members WHERE user_id = _user_id AND club_id = _club_id)
$$;

CREATE OR REPLACE FUNCTION public.is_club_owner(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.club_members WHERE user_id = _user_id AND club_id = _club_id AND role IN ('owner','admin'))
$$;

-- Trigger to add creator as owner
CREATE OR REPLACE FUNCTION public.tg_club_add_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.club_members (club_id, user_id, role) VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (club_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_club_add_owner AFTER INSERT ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.tg_club_add_owner();
CREATE TRIGGER trg_clubs_updated BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Clubs policies
CREATE POLICY "clubs members read" ON public.clubs FOR SELECT TO authenticated USING (public.is_club_member(auth.uid(), id));
CREATE POLICY "clubs auth insert" ON public.clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clubs owner update" ON public.clubs FOR UPDATE TO authenticated USING (public.is_club_owner(auth.uid(), id));
CREATE POLICY "clubs owner delete" ON public.clubs FOR DELETE TO authenticated USING (public.is_club_owner(auth.uid(), id));

-- Club members policies
CREATE POLICY "club_members self read" ON public.club_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_club_member(auth.uid(), club_id));
CREATE POLICY "club_members owner manage insert" ON public.club_members FOR INSERT TO authenticated WITH CHECK (public.is_club_owner(auth.uid(), club_id) OR user_id = auth.uid());
CREATE POLICY "club_members owner manage update" ON public.club_members FOR UPDATE TO authenticated USING (public.is_club_owner(auth.uid(), club_id));
CREATE POLICY "club_members owner manage delete" ON public.club_members FOR DELETE TO authenticated USING (public.is_club_owner(auth.uid(), club_id));

-- ============= COACHES =============
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches club access" ON public.coaches FOR ALL TO authenticated USING (public.is_club_member(auth.uid(), club_id)) WITH CHECK (public.is_club_member(auth.uid(), club_id));
CREATE TRIGGER trg_coaches_updated BEFORE UPDATE ON public.coaches FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============= TEAMS =============
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  season TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams club access" ON public.teams FOR ALL TO authenticated USING (public.is_club_member(auth.uid(), club_id)) WITH CHECK (public.is_club_member(auth.uid(), club_id));
CREATE TRIGGER trg_teams_updated BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============= ATHLETES =============
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  age INT,
  position public.position_enum,
  jersey_number INT,
  photo_url TEXT,
  height_cm INT,
  weight_kg NUMERIC(5,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athletes TO authenticated;
GRANT ALL ON public.athletes TO service_role;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athletes club access" ON public.athletes FOR ALL TO authenticated USING (public.is_club_member(auth.uid(), club_id)) WITH CHECK (public.is_club_member(auth.uid(), club_id));
CREATE TRIGGER trg_athletes_updated BEFORE UPDATE ON public.athletes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============= FIELDS =============
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  width_m NUMERIC(6,2),
  length_m NUMERIC(6,2),
  surface public.field_surface,
  gps_lat NUMERIC(10,6),
  gps_lng NUMERIC(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fields TO authenticated;
GRANT ALL ON public.fields TO service_role;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fields club access" ON public.fields FOR ALL TO authenticated USING (public.is_club_member(auth.uid(), club_id)) WITH CHECK (public.is_club_member(auth.uid(), club_id));
CREATE TRIGGER trg_fields_updated BEFORE UPDATE ON public.fields FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============= SESSIONS =============
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  session_type public.session_type NOT NULL DEFAULT 'treino',
  status public.session_status NOT NULL DEFAULT 'queued',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_min INT,
  gps_file_url TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions club access" ON public.sessions FOR ALL TO authenticated USING (public.is_club_member(auth.uid(), club_id)) WITH CHECK (public.is_club_member(auth.uid(), club_id));
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============= HEATMAPS =============
CREATE TABLE public.heatmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  heatmap_png_url TEXT,
  thumbnail_url TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heatmaps TO authenticated;
GRANT ALL ON public.heatmaps TO service_role;
ALTER TABLE public.heatmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "heatmaps club access" ON public.heatmaps FOR ALL TO authenticated USING (public.is_club_member(auth.uid(), club_id)) WITH CHECK (public.is_club_member(auth.uid(), club_id));
CREATE TRIGGER trg_heatmaps_updated BEFORE UPDATE ON public.heatmaps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============= REPORTS =============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period TEXT,
  report_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports club access" ON public.reports FOR ALL TO authenticated USING (public.is_club_member(auth.uid(), club_id)) WITH CHECK (public.is_club_member(auth.uid(), club_id));
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============= TRANSFERS =============
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  from_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  to_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfers TO authenticated;
GRANT ALL ON public.transfers TO service_role;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transfers via athlete club" ON public.transfers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND public.is_club_member(auth.uid(), a.club_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND public.is_club_member(auth.uid(), a.club_id)));

-- Indexes
CREATE INDEX idx_teams_club ON public.teams(club_id);
CREATE INDEX idx_athletes_club ON public.athletes(club_id);
CREATE INDEX idx_athletes_team ON public.athletes(team_id);
CREATE INDEX idx_sessions_club ON public.sessions(club_id);
CREATE INDEX idx_sessions_athlete ON public.sessions(athlete_id);
CREATE INDEX idx_heatmaps_session ON public.heatmaps(session_id);
CREATE INDEX idx_club_members_user ON public.club_members(user_id);
CREATE INDEX idx_club_members_club ON public.club_members(club_id);

-- ============= STORAGE: club-logos bucket =============
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('club-logos', 'club-logos', true, 2097152, ARRAY['image/png','image/jpeg'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 2097152, allowed_mime_types = ARRAY['image/png','image/jpeg'];

-- Public read
CREATE POLICY "club-logos public read" ON storage.objects FOR SELECT USING (bucket_id = 'club-logos');

-- Authenticated members can manage their club's folder (path = {club_id}/...)
CREATE POLICY "club-logos members insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'club-logos' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "club-logos members update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'club-logos' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "club-logos members delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'club-logos' AND public.is_club_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
