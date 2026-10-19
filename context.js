// Single place for every URL the extension recognizes or links to.
// If the Power Slider site moves to a new domain, only this file changes.
export const SLIDER_ORIGIN = 'https://www.powerslider.app';
export const POWER_BI_ORIGIN = 'https://app.powerbi.com';

// The site picks its language from a NEXT_LOCALE cookie before the browser language, so a stale cookie
// (e.g. from once visiting /ar) sends users to the wrong language. A locale in the path wins over the
// cookie (and resets it), so every link to the site carries the browser's language.
const SITE_LOCALES = ['en', 'pt-BR', 'es', 'fr', 'de', 'it', 'nl', 'ar'];

export function siteLocale(uiLanguage = chrome.i18n.getUILanguage()) {
  const lang = uiLanguage.toLowerCase();
  const base = lang.split('-')[0];
  return (
    SITE_LOCALES.find((l) => l.toLowerCase() === lang) ??
    SITE_LOCALES.find((l) => l.toLowerCase().split('-')[0] === base) ??
    'en'
  );
}

const sitePage = (path) => `${SLIDER_ORIGIN}/${siteLocale()}${path}`;

export const LINKS = {
  home: sitePage(''),
  help: sitePage('/how-it-works'),
  compositions: sitePage('/home/composition'),
  terms: sitePage('/terms'),
  privacy: sitePage('/privacy'),
  powerBi: POWER_BI_ORIGIN,
};

// Power BI is served both from its own host and from inside Microsoft Fabric, with the same paths.
const POWER_BI_HOSTS = ['app.powerbi.com', 'app.fabric.microsoft.com'];
// The site moved from powerbislider.com, which still serves it for screens set up there.
const SLIDER_HOSTS = ['powerslider.app', 'www.powerslider.app', 'powerbislider.com', 'www.powerbislider.com'];

// Workspace id is a GUID, or "me" for "My workspace".
const REPORT_PATH = /\/groups\/([0-9a-f-]+|me)\/reports\/([0-9a-f-]+)/i;
// Reports opened through a Power BI App carry the app's own report id, which Power Slider can't open.
const APP_REPORT_PATH = /\/groups\/([0-9a-f-]+|me)\/apps\/([0-9a-f-]+)\/reports\/([0-9a-f-]+)/i;

// Match patterns (for contextMenus) covering every report page, app reports included.
export const REPORT_URL_PATTERNS = POWER_BI_HOSTS.map((host) => `https://${host}/groups/*/reports/*`);

/**
 * Classifies a tab URL:
 *   { kind: 'report', groupId, reportId } — a Power BI report, ready to present
 *   { kind: 'appReport' }                 — a report opened through a Power BI App
 *   { kind: 'powerbi' }                   — Power BI, but not on a report
 *   { kind: 'slider' }                    — the Power Slider site
 *   { kind: 'other' }                     — anything else
 */
export function getPageContext(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: 'other' };
  }
  if (parsed.protocol !== 'https:') return { kind: 'other' };
  if (SLIDER_HOSTS.includes(parsed.hostname)) return { kind: 'slider' };
  if (!POWER_BI_HOSTS.includes(parsed.hostname)) return { kind: 'other' };

  if (APP_REPORT_PATH.test(parsed.pathname)) return { kind: 'appReport' };
  const match = parsed.pathname.match(REPORT_PATH);
  if (!match) return { kind: 'powerbi' };
  return { kind: 'report', groupId: match[1], reportId: match[2] };
}

export function presentationUrl({ groupId, reportId }) {
  return sitePage(`/home/${groupId}/report/${reportId}?openSettings=1`);
}

// Tab titles look like "<Report name> - Power BI" (or "- Microsoft Fabric"). Null when there's no name.
export function reportName(title = '') {
  const name = title
    .replace(/\s*[-–|]\s*(Microsoft\s+)?(Power BI|Fabric)\s*$/i, '')
    .replace(/^(Microsoft\s+)?(Power BI|Fabric)\s*[-–|]\s*/i, '')
    .trim();
  return name && !/^(Microsoft\s+)?(Power BI|Fabric)$/i.test(name) ? name : null;
}
