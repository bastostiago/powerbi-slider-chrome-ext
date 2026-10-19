// Renders the store screenshots (1280x800) for every language from slides.html.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// Needs puppeteer and Chrome for Testing: PUPPETEER_DIR is a folder with puppeteer installed,
// CHROME the chrome.exe to drive (see README.md).
const require = createRequire(path.join(process.env.PUPPETEER_DIR, 'package.json'));
const puppeteer = require('puppeteer');

const HERE = path.dirname(new URL(import.meta.url).pathname.slice(1));
const OUT = path.join(HERE, '..', 'img');
fs.mkdirSync(OUT, { recursive: true });
const copy = JSON.parse(fs.readFileSync(path.join(HERE, 'copy.json'), 'utf8'));
const ui = JSON.parse(fs.readFileSync(path.join(HERE, 'ui-strings.json'), 'utf8'));
const ONLY = process.env.ONLY?.split(',');
const SLIDES = ['extension', 'presentation', 'compositions'];

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME,
  headless: true,
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
for (const lang of Object.keys(copy).filter((l) => !ONLY || ONLY.includes(l))) {
  for (const [i, slide] of SLIDES.entries()) {
    await page.goto(`file:///${HERE.replace(/\\/g, '/')}/slides.html`, { waitUntil: 'networkidle0' });
    const fit = await page.evaluate((args) => window.renderSlide(args), { lang, slide, copy: copy[lang], ui: ui[lang] });
    const file = path.join(OUT, `Screenshot_${i + 1}_${lang === 'pt-BR' ? 'pt' : lang}.png`);
    await page.screenshot({ path: file });
    console.log(path.basename(file), JSON.stringify(fit));
  }
}
await browser.close();
