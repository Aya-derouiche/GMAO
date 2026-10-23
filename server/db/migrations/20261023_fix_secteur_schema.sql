-- Align Neon with the sector API: sector creation does not require an
-- equipment association, and list/delete endpoints use the deleted flag.
BEGIN;

ALTER TABLE public.secteur
    ALTER COLUMN equipement_id DROP NOT NULL;

ALTER TABLE public.secteur
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.secteur
SET deleted = FALSE
WHERE deleted IS NULL;

ALTER TABLE public.secteur
    ALTER COLUMN deleted SET DEFAULT FALSE,
    ALTER COLUMN deleted SET NOT NULL;

COMMIT;
