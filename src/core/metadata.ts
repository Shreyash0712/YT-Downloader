import { execa } from 'execa';

export type MediaType = 'video' | 'playlist';

export interface MediaMetadata {
  url: string;
  title: string;
  type: MediaType;
  duration?: number; // In seconds
  playlistCount?: number;
}

/**
 * Fetches metadata for a given YouTube URL (single video or playlist).
 */
export async function fetchMetadata(url: string): Promise<MediaMetadata> {
  // Use --flat-playlist to avoid fetching individual video details for playlists, which is much faster.
  const { stdout } = await execa('yt-dlp', [
    '--dump-single-json',
    '--flat-playlist',
    url,
  ]);

  const data = JSON.parse(stdout);

  return {
    url,
    title: data.title || 'Unknown Title',
    type: data._type === 'playlist' ? 'playlist' : 'video',
    duration: data.duration,
    playlistCount: data.playlist_count || data.entries?.length,
  };
}
