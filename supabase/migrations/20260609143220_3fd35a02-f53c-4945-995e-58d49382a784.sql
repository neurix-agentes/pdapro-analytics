
-- Athletes — Fase 5.1 fundação
-- Convert position from enum to text to support PT-BR catalog
ALTER TABLE public.athletes ALTER COLUMN position TYPE text USING position::text;

-- New columns
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS secondary_position text,
  ADD COLUMN IF NOT EXISTS dominant_foot text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_session_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_report_at timestamptz,
  ADD COLUMN IF NOT EXISTS gps_enabled boolean NOT NULL DEFAULT false;

-- Check constraints
ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_dominant_foot_check;
ALTER TABLE public.athletes ADD CONSTRAINT athletes_dominant_foot_check
  CHECK (dominant_foot IS NULL OR dominant_foot IN ('Direito','Esquerdo','Ambidestro'));

ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_status_check;
ALTER TABLE public.athletes ADD CONSTRAINT athletes_status_check
  CHECK (status IN ('active','inactive'));

-- Backfill status from active boolean for existing rows
UPDATE public.athletes SET status = CASE WHEN active THEN 'active' ELSE 'inactive' END
  WHERE status IS NULL OR (active AND status <> 'active') OR (NOT active AND status <> 'inactive');

-- Keep active boolean in sync with status going forward
CREATE OR REPLACE FUNCTION public.tg_athletes_sync_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.active := (NEW.status = 'active');
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.active IS DISTINCT FROM OLD.active AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    NEW.status := CASE WHEN NEW.active THEN 'active' ELSE 'inactive' END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_athletes_sync_status ON public.athletes;
CREATE TRIGGER trg_athletes_sync_status
  BEFORE INSERT OR UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.tg_athletes_sync_status();

-- Unique shirt number per team
DROP INDEX IF EXISTS uniq_athletes_team_jersey;
CREATE UNIQUE INDEX uniq_athletes_team_jersey
  ON public.athletes (team_id, jersey_number)
  WHERE team_id IS NOT NULL AND jersey_number IS NOT NULL;

-- No duplicate exact name per team (case-insensitive)
DROP INDEX IF EXISTS uniq_athletes_team_name;
CREATE UNIQUE INDEX uniq_athletes_team_name
  ON public.athletes (team_id, lower(name))
  WHERE team_id IS NOT NULL;
