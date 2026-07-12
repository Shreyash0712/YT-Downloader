import { resolveBinary, testBinary, getCacheDir, getYtDlpDownloadInfo, getFfmpegDownloadInfo } from '../src/core/binaries.js';
import { ensureDependencies } from '../src/core/system.js';
import fs from 'node:fs/promises';
import os from 'node:os';

async function runAutoDownloadVerification() {
  console.log('\n==================================================================');
  console.log('🧪 Mux-YT Automatic Dependency Downloader Verification Suite');
  console.log('==================================================================\n');

  console.log(`System Environment:`);
  console.log(`  - Platform:     ${process.platform} (${os.release()})`);
  console.log(`  - Architecture: ${os.arch()}`);
  console.log(`  - Node Version: ${process.version}`);
  console.log(`  - Cache Dir:    ${getCacheDir()}`);

  const ytDlpInfo = getYtDlpDownloadInfo();
  const ffmpegInfo = getFfmpegDownloadInfo();
  console.log(`\nTarget Download URLs:`);
  console.log(`  - yt-dlp: ${ytDlpInfo.url} (Gzip: ${ytDlpInfo.isGzip})`);
  console.log(`  - ffmpeg: ${ffmpegInfo.url} (Gzip: ${ffmpegInfo.isGzip})\n`);

  try {
    console.log('Step 1: Testing fresh download and verification of yt-dlp (Tier 3 -> downloadBinary)...');
    const startTimeYt = Date.now();
    const ytDlpPath = await resolveBinary('yt-dlp', {
      forceUpdate: true,
      onProgress: (pct, msg) => {
        if (pct === 0 || pct === 50 || pct === 99 || pct === 100) {
          console.log(`  -> [yt-dlp: ${pct}%] ${msg}`);
        }
      },
    });
    const elapsedYt = ((Date.now() - startTimeYt) / 1000).toFixed(2);
    console.log(`  ✅ Successfully downloaded yt-dlp to "${ytDlpPath}" in ${elapsedYt}s`);

    const isYtWorking = await testBinary(ytDlpPath, 'yt-dlp');
    if (!isYtWorking) {
      throw new Error(`testBinary failed for freshly downloaded yt-dlp at "${ytDlpPath}"`);
    }
    console.log('  ✅ Verified yt-dlp execution (--version)');

    console.log('\nStep 2: Testing fresh download and verification of ffmpeg (Tier 3 -> downloadBinary)...');
    const startTimeFfmpeg = Date.now();
    const ffmpegPath = await resolveBinary('ffmpeg', {
      forceUpdate: true,
      onProgress: (pct, msg) => {
        if (pct === 0 || pct === 50 || pct === 99 || pct === 100) {
          console.log(`  -> [ffmpeg: ${pct}%] ${msg}`);
        }
      },
    });
    const elapsedFfmpeg = ((Date.now() - startTimeFfmpeg) / 1000).toFixed(2);
    console.log(`  ✅ Successfully downloaded ffmpeg to "${ffmpegPath}" in ${elapsedFfmpeg}s`);

    const isFfmpegWorking = await testBinary(ffmpegPath, 'ffmpeg');
    if (!isFfmpegWorking) {
      throw new Error(`testBinary failed for freshly downloaded ffmpeg at "${ffmpegPath}"`);
    }
    console.log('  ✅ Verified ffmpeg execution (-version)');

    console.log('\nStep 3: Testing cached binary resolution (Tier 2 -> Local Cache)...');
    const deps = await ensureDependencies((pct, msg) => {
      if (pct === 100) console.log(`  -> [cache check] ${msg}`);
    });
    console.log(`  ✅ ensureDependencies resolved successfully:`);
    console.log(`     - yt-dlp: ${deps.ytDlp}`);
    console.log(`     - ffmpeg: ${deps.ffmpeg}`);

    console.log('\n==================================================================');
    console.log('🎉 SUCCESS: Automatic dependency downloading & execution passed!');
    console.log('==================================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n==================================================================');
    console.error('❌ FAILURE: Automatic dependency downloader test failed!');
    console.error('==================================================================');
    console.error(`Error details: ${error?.stack || error?.message || error}\n`);
    process.exit(1);
  }
}

runAutoDownloadVerification();
