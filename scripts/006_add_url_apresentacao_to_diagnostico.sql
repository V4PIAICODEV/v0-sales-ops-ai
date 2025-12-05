-- Add url_apresentacao column to diagnostico table for Google Slides link
ALTER TABLE diagnostico 
ADD COLUMN IF NOT EXISTS url_apresentacao TEXT;

-- Add comment to column
COMMENT ON COLUMN diagnostico.url_apresentacao IS 'URL to access the Google Slides presentation';
