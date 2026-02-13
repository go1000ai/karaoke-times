-- Add YouTube video ID to song_queue for karaoke track playback
alter table song_queue add column if not exists youtube_video_id text;
