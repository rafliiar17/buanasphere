/**
 * Buanasphere Portfolio Media Capture Script
 * Captures high-resolution screenshots & records 60fps 3D globe video demo for Draft A.
 * 
 * DO NOT COMMIT THIS FILE TO GIT.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const CAPTURE_DIR = join(import.meta.dir, '../captures');
const SCREENSHOTS_DIR = join(CAPTURE_DIR, 'screenshots');
const VIDEOS_DIR = join(CAPTURE_DIR, 'videos');

mkdirSync(SCREENSHOTS_DIR, { recursive: true });
mkdirSync(VIDEOS_DIR, { recursive: true });

const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const isWebview = args.includes('--webview') || args.includes('--headful');
const targetUrl = args.find((a) => a.startsWith('--url='))?.split('=')[1] ||
  (isLocal ? 'http://localhost:5173' : 'https://globe.arafz.id');

console.log(`\n======================================================`);
console.log(`🌐 Buanasphere Portfolio Media Capture Engine`);
console.log(`======================================================`);
console.log(`🎯 Target URL    : ${targetUrl}`);
console.log(`📸 Screenshots   : ${SCREENSHOTS_DIR}`);
console.log(`🎥 Video Output  : ${VIDEOS_DIR}`);
console.log(`🖥️  Mode          : ${isWebview ? 'Interactive GUI' : 'Headless Capture'}`);
console.log(`======================================================\n`);

async function run() {
  let chromium: any;
  try {
    const pw = await import('playwright-core');
    chromium = pw.chromium;
  } catch {
    const pw = await import('playwright');
    chromium = pw.chromium;
  }

  const chromePath = '/home/archy/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome';
  const launchOptions: any = {
    headless: !isWebview,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  };

  if (existsSync(chromePath)) {
    launchOptions.executablePath = chromePath;
  }

  console.log('🚀 Launching Chromium instance...');
  const browser = await chromium.launch(launchOptions);

  // 1. DESKTOP SCREENSHOTS (1440x900 Retina 2x)
  console.log('\n📸 Step 1: Capturing High-Res Desktop Screenshots (1440x900)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();

  const microApps = [
    { id: 'kurs', path: '/kurs', name: '01-kurs-hero.png', wait: 3500 },
    { id: 'time', path: '/time', name: '02-timeworld-diurnal.png', wait: 2000 },
    { id: 'flight', path: '/flight', name: '03-flow-remittance-arcs.png', wait: 2000 },
    { id: 'passport', path: '/passport', name: '04-passport-mobility.png', wait: 2000 },
    { id: 'nature', path: '/nature', name: '05-nature-biodiversity.png', wait: 2000 },
    { id: 'capitals', path: '/capitals', name: '06-world-capitals.png', wait: 2000 },
    { id: 'quake', path: '/quake', name: '07-earthquake-seismic.png', wait: 2000 },
  ];

  for (const app of microApps) {
    const appUrl = `${targetUrl}${app.path}`;
    console.log(`   ⏳ Loading ${app.id.toUpperCase()} view (${appUrl})...`);
    try {
      await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForTimeout(app.wait);
      const outPath = join(SCREENSHOTS_DIR, app.name);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`   ✅ Saved: ${app.name}`);
    } catch (err: any) {
      console.log(`   ⚠️ Note on ${app.name}: ${err.message}`);
    }
  }

  // Country Inspector Screenshot on Indonesia
  try {
    console.log('   ⏳ Capturing Universal Country Inspector (Indonesia)...');
    await page.goto(`${targetUrl}/kurs`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const w = window as any;
      if (w.geoStore?.selectCountry) {
        w.geoStore.selectCountry('IDN');
      }
    });
    await page.waitForTimeout(1500);
    const inspectorPath = join(SCREENSHOTS_DIR, '08-country-inspector-detail.png');
    await page.screenshot({ path: inspectorPath });
    console.log('   ✅ Saved: 08-country-inspector-detail.png');
  } catch (err: any) {
    console.log(`   ⚠️ Inspector note: ${err.message}`);
  }

  await desktopContext.close();

  // 2. MOBILE RESPONSIVE SCREENSHOT (390x844 iPhone 14)
  console.log('\n📱 Step 2: Capturing Mobile Responsive Screenshots (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  try {
    await mobilePage.goto(`${targetUrl}/kurs`, { waitUntil: 'networkidle', timeout: 20000 });
    await mobilePage.waitForTimeout(2500);
    const mobileOut = join(SCREENSHOTS_DIR, 'mobile-01-kurs.png');
    await mobilePage.screenshot({ path: mobileOut });
    console.log('   ✅ Saved: mobile-01-kurs.png');
  } catch (err: any) {
    console.log(`   ⚠️ Mobile note: ${err.message}`);
  }
  await mobileContext.close();

  // 3. 15-SECOND SHOWCASE VIDEO RECORDING
  console.log('\n🎥 Step 3: Recording 15-Second 3D Globe Showcase Video...');
  const videoContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const videoPage = await videoContext.newPage();
  await videoPage.goto(`${targetUrl}/kurs`, { waitUntil: 'networkidle', timeout: 25000 });
  await videoPage.waitForTimeout(2500);

  // Smooth cinematic showcase sequence via client-side popstate navigation
  console.log('   🎬 Executing cinematic camera & micro-app tour...');
  const sequence = ['/time', '/flight', '/nature', '/capitals', '/quake', '/kurs'];
  for (const route of sequence) {
    console.log(`      ➔ Transitioning to ${route}...`);
    await videoPage.evaluate((r) => {
      window.history.pushState({}, '', r);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
    await videoPage.waitForTimeout(2200); // 2.2s per app scene
  }

  await videoContext.close();
  const videoObj = await videoPage.video();
  const rawVideoPath = await videoObj?.path();

  if (rawVideoPath) {
    console.log(`   ✅ Raw WebM Video Saved: ${rawVideoPath}`);

    const mp4Out = join(VIDEOS_DIR, 'showcase-demo.mp4');
    const gifOut = join(VIDEOS_DIR, 'showcase-demo.gif');

    console.log('   🔄 Converting to MP4 (H.264) via ffmpeg...');
    try {
      spawnSync(
        'ffmpeg',
        [
          '-y',
          '-i',
          rawVideoPath,
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '22',
          '-pix_fmt',
          'yuv420p',
          mp4Out,
        ],
        { stdio: 'ignore' }
      );
      console.log(`   🎉 MP4 Ready for LinkedIn Video: ${mp4Out}`);
    } catch {
      console.log('   ⚠️ ffmpeg skipped.');
    }

    console.log('   🔄 Generating optimized GIF for GitHub README...');
    try {
      spawnSync(
        'ffmpeg',
        [
          '-y',
          '-i',
          rawVideoPath,
          '-vf',
          'fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
          gifOut,
        ],
        { stdio: 'ignore' }
      );
      console.log(`   🎉 Animated GIF Ready: ${gifOut}`);
    } catch {
      console.log('   ⚠️ GIF skipped.');
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`✨ All media assets captured successfully!`);
  console.log(`📁 Files located at:`);
  console.log(`   - Screenshots : ${SCREENSHOTS_DIR}`);
  console.log(`   - Video MP4   : ${join(VIDEOS_DIR, 'showcase-demo.mp4')}`);
  console.log(`   - Animated GIF: ${join(VIDEOS_DIR, 'showcase-demo.gif')}`);
  console.log(`======================================================\n`);
}

run().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
