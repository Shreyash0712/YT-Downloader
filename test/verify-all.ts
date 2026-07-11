import { getYtDlpDownloadInfo, getFfmpegDownloadInfo, resolveBinary, testBinary } from '../src/core/binaries.js';
import fs from 'node:fs/promises';
import path from 'node:path';

interface TestTarget {
  platform: string;
  arch: string;
}

const TARGETS: TestTarget[] = [
  { platform: 'win32', arch: 'x64' },
  { platform: 'win32', arch: 'ia32' },
  { platform: 'win32', arch: 'arm64' },
  { platform: 'darwin', arch: 'x64' },
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'linux', arch: 'arm64' },
  { platform: 'linux', arch: 'aarch64' },
  { platform: 'linux', arch: 'arm' },
  { platform: 'linux', arch: 'ia32' },
];

async function verifyLiveUrl(url: string, name: string, platform: string, arch: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    // GitHub release download URLs typically return 302/303/307 redirecting to AWS S3 / release CDN, or 200 OK
    const isValid = res.status === 200 || res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307;
    if (isValid) {
      console.log(`  ✅ [${name}] (${platform}/${arch}) -> HTTP ${res.status} Verified: ${url}`);
      return true;
    } else {
      console.error(`  ❌ [${name}] (${platform}/${arch}) -> Unexpected HTTP ${res.status}: ${url}`);
      return false;
    }
  } catch (err: any) {
    console.error(`  ❌ [${name}] (${platform}/${arch}) -> Network/Fetch Error: ${err.message}`);
    return false;
  }
}

async function runVerificationSuite() {
  console.log('\n======================================================');
  console.log('🧪 Mux-YT v2.0.0 Pre-Publish Verification Suite');
  console.log('======================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  // 1. Cross-Platform Asset URL Reachability Test
  console.log('Test Suite 1: Live GitHub Asset Verification Across All OS/Arch Targets');
  console.log('------------------------------------------------------------------------');
  for (const target of TARGETS) {
    const ytdlpInfo = getYtDlpDownloadInfo(target.platform, target.arch);
    const ffmpegInfo = getFfmpegDownloadInfo(target.platform, target.arch);

    totalTests++;
    if (await verifyLiveUrl(ytdlpInfo.url, 'yt-dlp', target.platform, target.arch)) passedTests++;

    totalTests++;
    if (await verifyLiveUrl(ffmpegInfo.url, 'ffmpeg', target.platform, target.arch)) passedTests++;
  }

  // 2. Local Runtime Resolution Verification
  console.log('\nTest Suite 2: Local Tier Resolution & Process Orchestration Check');
  console.log('------------------------------------------------------------------------');
  try {
    totalTests++;
    const ytDlpPath = await resolveBinary('yt-dlp');
    const isYtDlpWorking = await testBinary(ytDlpPath, 'yt-dlp');
    if (isYtDlpWorking) {
      console.log(`  ✅ yt-dlp resolved to "${ytDlpPath}" and executed successfully (--version)`);
      passedTests++;
    } else {
      console.error(`  ❌ yt-dlp resolved to "${ytDlpPath}" but failed --version check`);
    }

    totalTests++;
    const ffmpegPath = await resolveBinary('ffmpeg');
    const isFfmpegWorking = await testBinary(ffmpegPath, 'ffmpeg');
    if (isFfmpegWorking) {
      console.log(`  ✅ ffmpeg resolved to "${ffmpegPath}" and executed successfully (-version)`);
      passedTests++;
    } else {
      console.error(`  ❌ ffmpeg resolved to "${ffmpegPath}" but failed -version check`);
    }
  } catch (err: any) {
    console.error(`  ❌ Runtime Resolution Error: ${err.message}`);
  }

  // 3. Package Integrity & File Structure Check
  console.log('\nTest Suite 3: Package Integrity & Distribution Verification');
  console.log('------------------------------------------------------------------------');
  const requiredFiles = ['dist/ui/index.js', 'dist/core/binaries.js', 'bin/mux-yt.js', 'package.json'];
  for (const file of requiredFiles) {
    totalTests++;
    try {
      await fs.access(path.join(process.cwd(), file));
      console.log(`  ✅ Required distribution file exists: ${file}`);
      passedTests++;
    } catch {
      console.error(`  ❌ Missing required distribution file: ${file} (Run pnpm build)`);
    }
  }

  // Summary
  console.log('\n======================================================');
  console.log(`📊 Verification Summary: ${passedTests}/${totalTests} Tests Passed`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 SUCCESS: All cross-platform URLs, binary resolvers, and package structures verified! Mux-YT v2.0.0 is 100% ready for publishing.');
    process.exit(0);
  } else {
    console.error('⚠️ FAILURE: One or more pre-publish verification tests failed. Please review the errors above.');
    process.exit(1);
  }
}

runVerificationSuite();
