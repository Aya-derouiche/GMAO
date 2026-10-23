-- Cloudinary delivery URLs can exceed the old varchar limits.
ALTER TABLE public.equipement
    ALTER COLUMN image TYPE TEXT,
    ALTER COLUMN fichier TYPE TEXT;

ALTER TABLE public.employee
    ALTER COLUMN documents TYPE TEXT;

ALTER TABLE public.composant
    ALTER COLUMN fichier TYPE TEXT;

ALTER TABLE public.nomlogo
    ALTER COLUMN image TYPE TEXT;
