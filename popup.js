import { LINKS, getPageContext, reportName } from './context.js';
import { clearRecents, getRecents, openRecent, startPresentation } from './presentations.js';

const msg = (key) => chrome.i18n.getMessage(key);
const locale = msg('locale');

localize();
wireLinks();
document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version}`;

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const context = getPageContext(tab?.url);

if (context.kind === 'report') {
  document.getElementById('reportName').textContent = reportName(tab.title) ?? msg('currentReport');
  document.getElementById('myWorkspace').hidden = context.groupId !== 'me';

  document.getElementById('startButton').addEventListener('click', async () => {
    await startPresentation(tab);
    window.close();
  });
  await showShortcut();
}

document.querySelector(`[data-view="${context.kind}"]`).hidden = false;
await renderRecents();

// Text nodes: data-i18n="key". Attributes: data-i18n-attr="attr:key".
function localize() {
  document.documentElement.lang = locale;
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = msg(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-attr]')) {
    const [attr, key] = el.dataset.i18nAttr.split(':');
    el.setAttribute(attr, msg(key));
  }
}

function wireLinks() {
  for (const el of document.querySelectorAll('[data-link]')) {
    el.href = LINKS[el.dataset.link];
    el.target = '_blank';
    el.rel = 'noopener';
  }
}

// The user can change or remove the shortcut in chrome://extensions/shortcuts.
async function showShortcut() {
  const commands = await chrome.commands.getAll();
  const shortcut = commands.find((c) => c.name === 'start-presentation')?.shortcut;
  if (!shortcut) return;
  document.querySelector('#shortcut kbd').textContent = shortcut;
  document.getElementById('shortcut').hidden = false;
}

async function renderRecents() {
  const recents = (await getRecents()).filter((r) => r.reportId !== context.reportId);
  if (!recents.length) return;

  const section = document.getElementById('recents');
  const list = document.getElementById('recentList');
  const template = document.getElementById('recentItem');

  for (const report of recents) {
    const item = template.content.cloneNode(true);
    const name = report.name ?? msg('untitledReport');
    item.querySelector('.recent-name').textContent = name;
    item.querySelector('.recent-time').textContent = timeAgo(report.presentedAt);
    const button = item.querySelector('button');
    button.title = name;
    button.addEventListener('click', async () => {
      await openRecent(report);
      window.close();
    });
    list.append(item);
  }

  document.getElementById('clearRecents').addEventListener('click', async () => {
    await clearRecents();
    section.hidden = true;
  });
  section.hidden = false;
}

function timeAgo(timestamp) {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minutes = Math.round((timestamp - Date.now()) / 60_000);
  if (minutes === 0) return format.format(0, 'second'); // "now" / "agora"
  if (minutes > -60) return format.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours > -24) return format.format(hours, 'hour');
  return format.format(Math.round(hours / 24), 'day');
}
