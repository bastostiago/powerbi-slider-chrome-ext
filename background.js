import { REPORT_URL_PATTERNS, getPageContext } from './context.js';
import { startPresentation } from './presentations.js';

const COMMAND_START = 'start-presentation';
const MENU_START = 'start-presentation';

const iconSet = (state) =>
  Object.fromEntries([16, 32, 48, 128].map((size) => [size, `img/icon_${state}_${size}.png`]));

// Colored on Power BI and Power Slider pages; "ready" adds a small green dot when a report can be presented.
// (Chrome's own badge was too big for a 16px icon, so the dot is drawn into the icon itself.)
const ICONS = {
  report: iconSet('ready'),
  other: iconSet('disabled'),
};
const DEFAULT_ICON = iconSet('enabled');

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_START,
    title: chrome.i18n.getMessage('contextMenuStart'),
    contexts: ['page'],
    documentUrlPatterns: REPORT_URL_PATTERNS,
  });

  // Tabs opened before install/update haven't had their icon set yet.
  for (const tab of await chrome.tabs.query({})) updateAction(tab);
});

// Power BI is a single-page app, so moving into a report often changes only the URL.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') updateAction(tab);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === COMMAND_START) startOrExplain(tab);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_START) startOrExplain(tab);
});

function updateAction(tab) {
  if (!tab.url) return;
  const { kind } = getPageContext(tab.url);
  chrome.action.setIcon({ tabId: tab.id, path: ICONS[kind] ?? DEFAULT_ICON }).catch(() => {}); // tab may be gone
}

async function startOrExplain(tab) {
  if (await startPresentation(tab)) return;
  // Not on a presentable report: the popup explains what to do. Fails silently if Chrome refuses to open it.
  chrome.action.openPopup().catch(() => {});
}
