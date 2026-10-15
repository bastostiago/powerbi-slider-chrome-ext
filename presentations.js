import { getPageContext, presentationUrl, reportName } from './context.js';

const RECENTS_KEY = 'recentPresentations';
const MAX_RECENTS = 3;

/** Most recent first: [{ groupId, reportId, name, presentedAt }] */
export async function getRecents() {
  const { [RECENTS_KEY]: recents = [] } = await chrome.storage.local.get(RECENTS_KEY);
  return recents;
}

export async function clearRecents() {
  await chrome.storage.local.remove(RECENTS_KEY);
}

/** Opens the active tab's report in Power Slider. Returns false when the tab isn't a presentable report. */
export async function startPresentation(tab) {
  const context = getPageContext(tab?.url);
  if (context.kind !== 'report') return false;

  const { groupId, reportId } = context;
  await open({ groupId, reportId, name: reportName(tab.title) }, tab);
  return true;
}

export async function openRecent(report) {
  await open(report);
}

async function open(report, besideTab) {
  // Remember first: opening the new tab closes the popup, which would cut the storage write short.
  await remember(report);
  await chrome.tabs.create({
    url: presentationUrl(report),
    ...(besideTab && { index: besideTab.index + 1, openerTabId: besideTab.id }),
  });
}

async function remember({ groupId, reportId, name }) {
  const others = (await getRecents()).filter((r) => r.reportId !== reportId);
  const recents = [{ groupId, reportId, name, presentedAt: Date.now() }, ...others].slice(0, MAX_RECENTS);
  await chrome.storage.local.set({ [RECENTS_KEY]: recents });
}
