import { execa } from 'execa';
import path from 'node:path';
import os from 'node:os';

export interface DownloadOptions {
  url: string;
  type: 'video' | 'playlist';
  title: string;
  format: 'mp4' | 'mp3';
  maxQuality: '480p' | '720p' | '1080p' | 'best';
  isMergeMode: boolean;
  startLimit?: string;
  endLimit?: string;
  tempDir?: string;
}

/**
 * Returns the final base directory where media should be stored.
 * E.g., Downloads/yt-grab/<Title>/
 */
export function getFinalOutputDir(title: string): string {
  const downloadsFolder = path.join(os.homedir(), 'Downloads');
  const safeTitle = title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  return path.join(downloadsFolder, 'yt-grab', safeTitle);
}

/**
 * Constructs the yt-dlp arguments based on options.
 */
export function buildYtDlpArgs(options: DownloadOptions, outputDir: string): string[] {
  const args: string[] = [];

  // 1. Output Template
  const outTmpl = path.join(outputDir, '%(title)s.%(ext)s');
  args.push('-o', outTmpl);

  // 2. Format & Quality
  if (options.format === 'mp3') {
    args.push('--extract-audio', '--audio-format', 'mp3');
    args.push('-f', 'bestaudio');
  } else {
    // MP4 Video
    let resLimit = '';
    if (options.maxQuality !== 'best') {
      resLimit = `[height<=${options.maxQuality.replace('p', '')}]`;
    }
    // Strict format to enforce MP4 container and identical codecs for merging
    args.push('-f', `bestvideo${resLimit}[ext=mp4]+bestaudio[ext=m4a]/best${resLimit}[ext=mp4]/best`);
    args.push('--merge-output-format', 'mp4');
  }

  // 3. Limits (Trimming / Playlist filtering)
  if (options.type === 'video') {
    if (options.startLimit || options.endLimit) {
      const start = options.startLimit || '0';
      const end = options.endLimit || 'inf';
      args.push('--download-sections', `*${start}-${end}`);
      // When using --download-sections, it's safer to enforce ffmpeg processing
      args.push('--force-keyframes-at-cuts');
    }
  } else if (options.type === 'playlist') {
    if (options.startLimit || options.endLimit) {
      const start = options.startLimit || '1';
      const end = options.endLimit || '';
      args.push('--playlist-items', `${start}:${end}`);
    } else {
      args.push('--yes-playlist');
    }
  }

  // Target URL
  args.push(options.url);

  return args;
}

/**
 * Executes yt-dlp to download the media.
 * Returns the execa child process so the UI can listen to stdout for progress.
 */
export function downloadMedia(options: DownloadOptions) {
  const finalDir = getFinalOutputDir(options.title);
  const targetDir = options.tempDir || finalDir;

  const args = buildYtDlpArgs(options, targetDir);

  return execa('yt-dlp', args, {
    all: true,
  });
}
