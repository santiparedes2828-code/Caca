// usage: node render.js out.mp4 [fps] [t1,t2,... for stills]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dir = __dirname;
(async () => {
  const out = process.argv[2];
  const fps = parseInt(process.argv[3] || '30');
  const stills = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(dir, 'scene3.html'));
  const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));
  await page.evaluate(w => window.setup(w), words);
  if (stills) {
    for (const t of stills) {
      const d = await page.evaluate(t => window.frame(t), t);
      fs.writeFileSync(path.join(out, `still_${t.toFixed(2)}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
    }
    await browser.close(); return;
  }
  const TOTAL = 35.0, N = Math.round(TOTAL * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < N; i++) {
    const d = await page.evaluate(t => window.frame(t), i / fps);
    const buf = Buffer.from(d.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done');
})();
