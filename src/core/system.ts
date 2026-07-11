import { resolveBinary, BinaryName } from './binaries.js';

export interface DependencyPaths {
  ytDlp: string;
  ffmpeg: string;
}

/**
 * Ensures required dependencies (yt-dlp & ffmpeg) are resolved across Tier 1 (PATH),
 * Tier 2 (Local Cache), or Tier 3 (Runtime Download).
 */
export async function ensureDependencies(
  onProgress?: (percent: number, message: string) => void
): Promise<DependencyPaths> {
  onProgress?.(5, 'Checking yt-dlp binary...');
  const ytDlp = await resolveBinary('yt-dlp', { onProgress });

  onProgress?.(50, 'Checking ffmpeg binary...');
  const ffmpeg = await resolveBinary('ffmpeg', { onProgress });

  onProgress?.(100, 'Dependencies verified!');
  return { ytDlp, ffmpeg };
}

/**
 * Backwards compatible checkDependencies that delegates to ensureDependencies.
 */
export async function checkDependencies(
  onProgress?: (percent: number, message: string) => void
): Promise<void> {
  await ensureDependencies(onProgress);
}

/**
 * Forces a re-download/update of cached standalone dependencies (useful for keeping yt-dlp updated).
 */
export async function updateDependencies(
  onProgress?: (percent: number, message: string) => void
): Promise<DependencyPaths> {
  const ytDlp = await resolveBinary('yt-dlp', { forceUpdate: true, onProgress });
  const ffmpeg = await resolveBinary('ffmpeg', { forceUpdate: true, onProgress });
  return { ytDlp, ffmpeg };
}

