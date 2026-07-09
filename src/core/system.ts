import { execa } from 'execa';

/**
 * Checks if required dependencies are available in the system PATH.
 * Throws an error if they are not found.
 */
export async function checkDependencies() {
  try {
    await execa('yt-dlp', ['--version']);
  } catch (error) {
    throw new Error('yt-dlp is not installed or not available in PATH.');
  }

  try {
    await execa('ffmpeg', ['-version']);
  } catch (error) {
    throw new Error('ffmpeg is not installed or not available in PATH.');
  }
}
