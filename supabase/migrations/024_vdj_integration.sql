-- VirtualDJ integration columns on song_queue
-- Tracks when a song was loaded into VDJ and what file path was used
ALTER TABLE song_queue ADD COLUMN IF NOT EXISTS vdj_loaded_at TIMESTAMPTZ;
ALTER TABLE song_queue ADD COLUMN IF NOT EXISTS vdj_file_path TEXT;
