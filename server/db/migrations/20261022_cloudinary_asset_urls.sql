-- Cloudinary delivery URLs are longer than the previous 100-character limit.
ALTER TABLE equipement ALTER COLUMN image TYPE TEXT;
ALTER TABLE nomlogo ALTER COLUMN image TYPE TEXT;
