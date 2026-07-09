import { execa } from 'execa';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Merges media files using ffmpeg concat demuxer.
 * @param tempDir The directory containing the downloaded files to merge.
 * @param finalOutputDir The directory where the merged file should be placed.
 * @param outputFilename The name of the final merged file (e.g., "Merged_Queue.mp4").
 */
export async function mergeMedia(
  tempDir: string,
  finalOutputDir: string,
  outputFilename: string
): Promise<void> {
  // Ensure the final directory exists
  await fs.mkdir(finalOutputDir, { recursive: true });

  const filesTxtPath = path.join(tempDir, 'files.txt');
  const finalFilePath = path.join(finalOutputDir, outputFilename);

  // Read all files in the temp directory (filter out non-media files if necessary)
  const dirContents = await fs.readdir(tempDir);
  const mediaFiles = dirContents.filter((f: string) => !f.endsWith('.txt') && !f.endsWith('.part'));

  if (mediaFiles.length === 0) {
    throw new Error('No media files found to merge.');
  }

  // Create the files.txt for ffmpeg
  // Using relative paths inside the temp directory avoids Windows path issues in ffmpeg
  const fileLines = mediaFiles.map((f: string) => `file '${f.replace(/'/g, "'\\''")}'`);
  await fs.writeFile(filesTxtPath, fileLines.join('\n'), 'utf-8');

  // Execute ffmpeg concat
  await execa(
    'ffmpeg',
    [
      '-f', 'concat',
      '-safe', '0',
      '-i', 'files.txt',
      '-c', 'copy',
      finalFilePath,
      '-y', // Overwrite if exists
    ],
    {
      cwd: tempDir, // Run ffmpeg inside tempDir so relative paths work
    }
  );
}

/**
 * Cleans up the temporary directory.
 */
export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to cleanup temp directory: ${tempDir}`, error);
  }
}
