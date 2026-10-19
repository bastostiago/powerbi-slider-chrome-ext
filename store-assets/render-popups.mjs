// Renders the real extension popup (report detected + two recents) in every language, at 2x.
import { createRequire } from 'node:module';
import path from 'node:path';

// Same requirements as render-slides.mjs. The popup is rendered in a visible window: headless
// Chrome opens extension popups narrower than their content, which cuts the Arabic one.
const require = createRequire(path.join(process.env.PUPPETEER_DIR, 'package.json'));
const puppeteer = require('puppeteer');

const EXT = 'D:/Tiago/Atomo/powerbi-slider-chrome-ext';
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), 'popups');
const CHROME = process.env.CHROME;
const REPORT = 'https://app.powerbi.com/groups/me/reports/90cee26e-f0d9-4ef8-9ca1-2eccfce2e291/ReportSection38d?experience=power-bi';
const ONLY = process.env.ONLY;
const RECENTS = {
  en: ['Financial Overview', 'Operations KPIs'],
  'pt-BR': ['Visão Financeira', 'Indicadores de Operação'],
  es: ['Resumen financiero', 'KPI de operaciones'],
  fr: ['Synthèse financière', 'KPI opérationnels'],
  de: ['Finanzübersicht', 'Betriebs-KPIs'],
  it: ['Panoramica finanziaria', 'KPI operativi'],
  nl: ['Financieel overzicht', "Operationele KPI's"],
  ar: ['نظرة مالية عامة', 'مؤشرات أداء العمليات'],
};

for (const [lang, names] of Object.entries(RECENTS).filter(([l]) => !ONLY || l === ONLY)) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, `--lang=${lang}`, '--force-device-scale-factor=2'],
  });
  const sw = await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('background.js'));
  const worker = await sw.worker();
  while (!(await worker.evaluate(() => !!chrome.storage))) await new Promise((r) => setTimeout(r, 100));
  const extId = new URL(sw.url()).host;
  await worker.evaluate(async (names) => {
    const now = Date.now();
    await chrome.storage.local.set({
      recentPresentations: names.map((name, i) => ({ groupId: 'me', reportId: `r${i}`, name, presentedAt: now - (i + 1) * 26 * 3600_000 })),
    });
  }, names);

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) =>
    req.isNavigationRequest() && req.url().startsWith('https://app.powerbi.com')
      ? req.respond({ status: 200, contentType: 'text/html', body: '<title>Sales Analysis - Power BI</title>' })
      : req.continue(),
  );
  await page.goto(REPORT);
  await page.bringToFront();
  let opened;
  for (let i = 0; i < 10 && opened !== 'ok'; i++) {
    if (i) await new Promise((r) => setTimeout(r, 300));
    opened = await worker.evaluate(() => chrome.action.openPopup().then(() => 'ok', (e) => e.message));
  }
  const target = await browser.waitForTarget((t) => t.url() === `chrome-extension://${extId}/index.html`);
  const popup = await target.asPage();
  await popup.waitForFunction(() => !document.getElementById('recents').hidden);
  await new Promise((r) => setTimeout(r, 600));
  const info = await popup.evaluate(() => ({ dir: document.documentElement.dir, width: innerWidth, height: document.body.offsetHeight }));
  await (await popup.$('body')).screenshot({ path: path.join(OUT, `popup_${lang}.png`) });
  console.log(lang, JSON.stringify(info));
  await browser.close();
}
