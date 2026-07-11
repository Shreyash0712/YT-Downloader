import { execa } from 'execa';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export type BinaryName = 'yt-dlp' | 'ffmpeg';

export interface ResolveOptions {
  forceUpdate?: boolean;
  onProgress?: (percent: number, message: string) => void;
}

// In-memory resolution cache to avoid redundant PATH / filesystem checks during single workflow executions
const resolvedCache: Record<BinaryName, string | null> = {
  'yt-dlp': null,
  'ffmpeg': null,
};

/**
 * Returns the local user cache directory where standalone binaries are stored.
 */
export function getCacheDir(): string {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(localAppData, 'mux-yt', 'bin');
  }
  return path.join(os.homedir(), '.cache', 'mux-yt', 'bin');
}

/**
 * Returns the expected filename of the binary for the current operating system.
 */
export function getBinaryFilename(name: BinaryName): string {
  return process.platform === 'win32' ? `${name}.exe` : name;
}

/**
 * Returns the full absolute path to the local cached binary.
 */
export function getCachedBinaryPath(name: BinaryName): string {
  return path.join(getCacheDir(), getBinaryFilename(name));
}

/**
 * Tests if a binary command or absolute path executes correctly.
 */
export async function testBinary(cmdPath: string, name: BinaryName): Promise<boolean> {
  try {
    const args = name === 'yt-dlp' ? ['--version'] : ['-version'];
    await execa(cmdPath, args, { timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the standalone download URL for yt-dlp according to current OS and Architecture.
 */
export function getYtDlpDownloadInfo(platform: string = os.platform(), arch: string = os.arch()): { url: string; isGzip: boolean } {
  const baseUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';

  if (platform === 'win32') {
    if (arch === 'ia32') {
      return { url: `${baseUrl}/yt-dlp_x86.exe`, isGzip: false };
    }
    return { url: `${baseUrl}/yt-dlp.exe`, isGzip: false };
  } else if (platform === 'darwin') {
    return { url: `${baseUrl}/yt-dlp_macos`, isGzip: false };
  } else {
    // linux and others
    if (arch === 'arm64' || arch === 'aarch64') {
      return { url: `${baseUrl}/yt-dlp_linux_aarch64`, isGzip: false };
    } else if (arch === 'arm') {
      return { url: `${baseUrl}/yt-dlp_linux_armv7l`, isGzip: false };
    }
    return { url: `${baseUrl}/yt-dlp_linux`, isGzip: false };
  }
}

/**
 * Returns the standalone static binary download info for ffmpeg according to current OS and Architecture.
 * Uses eugeneware/ffmpeg-static latest release mirrors which provide single gzip binaries across platforms.
 */
export function getFfmpegDownloadInfo(platform: string = os.platform(), arch: string = os.arch()): { url: string; isGzip: boolean } {
  const baseUrl = 'https://github.com/eugeneware/ffmpeg-static/releases/latest/download';

  if (platform === 'win32') {
    if (arch === 'ia32') {
      return { url: `${baseUrl}/win32-ia32.gz`, isGzip: true };
    }
    return { url: `${baseUrl}/win32-x64.gz`, isGzip: true };
  } else if (platform === 'darwin') {
    if (arch === 'arm64') {
      return { url: `${baseUrl}/darwin-arm64.gz`, isGzip: true };
    }
    return { url: `${baseUrl}/darwin-x64.gz`, isGzip: true };
  } else {
    // linux and others
    if (arch === 'arm64' || (arch as string) === 'aarch64') {
      return { url: `${baseUrl}/linux-arm64.gz`, isGzip: true };
    } else if (arch === 'ia32') {
      return { url: `${baseUrl}/linux-ia32.gz`, isGzip: true };
    } else if (arch === 'arm') {
      return { url: `${baseUrl}/linux-arm.gz`, isGzip: true };
    }
    return { url: `${baseUrl}/linux-x64.gz`, isGzip: true };
  }
}

/**
 * Downloads and extracts/stores the target binary into ~/.cache/mux-yt/bin/<name>[.exe].
 */
export async function downloadBinary(name: BinaryName, onProgress?: (percent: number, message: string) => void): Promise<string> {
  const cacheDir = getCacheDir();
  await fs.mkdir(cacheDir, { recursive: true });

  const targetPath = getCachedBinaryPath(name);
  const tempPath = `${targetPath}.part`;

  const info = name === 'yt-dlp' ? getYtDlpDownloadInfo() : getFfmpegDownloadInfo();

  onProgress?.(0, `Connecting to download ${name}...`);

  const response = await fetch(info.url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${name} from ${info.url}: HTTP ${response.status} ${response.statusText}`);
  }

  const contentLengthHeader = response.headers.get('content-length');
  const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
  let downloadedBytes = 0;

  // Convert Web ReadableStream to Node Readable stream for pipeline processing and progress tracking
  const webStream = response.body as unknown as ReadableStream<Uint8Array>;
  const reader = webStream.getReader();

  const progressStream = new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
          return;
        }
        downloadedBytes += value.byteLength;
        if (totalBytes > 0 && onProgress) {
          const percent = Math.min(Math.round((downloadedBytes / totalBytes) * 100), 100);
          onProgress(percent, `Downloading ${name}... (${(downloadedBytes / (1024 * 1024)).toFixed(1)}MB / ${(totalBytes / (1024 * 1024)).toFixed(1)}MB)`);
        } else if (onProgress) {
          onProgress(50, `Downloading ${name}... (${(downloadedBytes / (1024 * 1024)).toFixed(1)}MB)`);
        }
        this.push(Buffer.from(value));
      } catch (err) {
        this.destroy(err as Error);
      }
    },
  });

  const fileWriteStream = createWriteStream(tempPath);

  if (info.isGzip) {
    const gunzip = zlib.createGunzip();
    await pipeline(progressStream, gunzip, fileWriteStream);
  } else {
    await pipeline(progressStream, fileWriteStream);
  }

  // Ensure execution permissions on Unix/macOS
  if (process.platform !== 'win32') {
    await fs.chmod(tempPath, 0o755);
  }

  // Rename part file to final path
  await fs.rename(tempPath, targetPath);

  // Verify the downloaded binary runs cleanly
  onProgress?.(99, `Verifying ${name}...`);
  const isValid = await testBinary(targetPath, name);
  if (!isValid) {
    await fs.rm(targetPath, { force: true });
    throw new Error(`Downloaded ${name} binary failed self-verification. Please check your system architecture compatibility.`);
  }

  onProgress?.(100, `${name} ready!`);
  resolvedCache[name] = targetPath;
  return targetPath;
}

/**
 * Resolves the executable path for the requested binary using the 3-Tier Priority Chain:
 * Tier 1: Global System PATH
 * Tier 2: Local User App Cache (~/.cache/mux-yt/bin/ or %LOCALAPPDATA%\mux-yt\bin\)
 * Tier 3: Runtime Lazy Downloader
 */
export async function resolveBinary(name: BinaryName, options?: ResolveOptions): Promise<string> {
  if (!options?.forceUpdate && resolvedCache[name]) {
    return resolvedCache[name]!;
  }

  if (!options?.forceUpdate) {
    // Tier 1: System PATH
    if (await testBinary(name, name)) {
      resolvedCache[name] = name;
      return name;
    }

    // Tier 2: Local Cache
    const cachedPath = getCachedBinaryPath(name);
    if (await testBinary(cachedPath, name)) {
      resolvedCache[name] = cachedPath;
      return cachedPath;
    }
  }

  // Tier 3: Runtime Lazy Downloader
  return await downloadBinary(name, options?.onProgress);
}

/**
 * Clears the in-memory binary path resolution cache.
 */
export function clearResolutionCache(): void {
  resolvedCache['yt-dlp'] = null;
  resolvedCache['ffmpeg'] = null;
}
