# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Power Slider** — a browser extension (Manifest V3; Chrome, Edge, Opera and Firefox) that is a companion to the Power Slider web app at https://www.powerslider.app. The site's old domain, https://www.powerbislider.com, still serves the same app for screens set up there, so both are recognized as the site. When the user is on a Power BI Service report, the popup's "Start presentation" button opens that report in Power Slider.

The product was renamed from "Power BI Slider" because the Chrome Web Store blocked it in several countries for using the "Power BI" trademark. Do not put "Power BI" (or Microsoft's yellow-bar-chart look) in the extension name, icons or branding. Referring to "Microsoft Power BI" in descriptive text is fine, alongside the "not affiliated with Microsoft" disclaimer.

## Development

There is no build step, package manager, linter, or test suite. Chrome loads the files in the repo root as-is.

- Load: `chrome://extensions` → enable Developer mode → "Load unpacked" → select the repo root.
- Reload after changes with the extension's reload button; reopen the popup to see popup changes.
- Popup logs: right-click the popup → Inspect. Background logs: the "service worker" link on the extension's card.
- Automated testing: branded Google Chrome no longer honors `--load-extension`; use Chrome for Testing (e.g. via Puppeteer) with `--disable-extensions-except=<repo> --load-extension=<repo>`. Power BI pages can be faked with request interception (they need login otherwise). `chrome.action.openPopup()` from the service worker opens the real popup as a target you can drive. Extension keyboard shortcuts can't be triggered through CDP key events. Wait for `chrome.storage` to exist before evaluating in the worker, since bindings appear shortly after the target does.
- Release: bump `version` in `manifest.json`, then `python package.py` → `dist/power-slider-<version>.zip` (Chrome, Edge, Opera) and `dist/power-slider-firefox-<version>.zip` (git-ignored).
- Firefox runs the same code (its `chrome.*` returns promises under MV3). Only the manifest differs, and `package.py` writes the Firefox one into that zip: the background module as an event page (`background.scripts`, no service worker in Firefox), the add-on id of the existing AMO listing, `strict_min_version` 140 (the current ESR) and `data_collection_permissions: none`. Validate with `npx addons-linter dist/power-slider-firefox-<version>.zip`. This replaces the separate `powerbi-slider-firefox-ext` repo, which stayed at 1.0.2. The script packages only what the extension loads: root `*.js`, `index.html`, `style.css`, `_locales`, and the toolbar icons listed in its `ICON_STATES`. It fails if the manifest, popup or a JS import references a file it didn't include. Store-listing text, permission justifications and the image-to-field mapping live in `store-listing.md`.
- `manifest.json` `description` (from `_locales`) is capped at 132 characters.

## Architecture

All scripts are ES modules (`"type": "module"` service worker, `<script type="module">` popup), sharing two modules:

- `context.js` — single source of truth for URLs: the Power Slider origin, every outbound link (`LINKS`), the recognized hosts (`app.powerbi.com` and `app.fabric.microsoft.com`, which serve Power BI under the same paths), `getPageContext(url)` and `presentationUrl()`. `getPageContext` classifies a tab as `report` (with `groupId`/`reportId` from `/groups/<id|me>/reports/<id>`; `me` is "My workspace"), `appReport` (`/groups/…/apps/…/reports/…` — the id there is the App's, which Power Slider can't open, so it is not presentable), `powerbi`, `slider` or `other`. Also `reportName(tabTitle)`, which strips the `" - Power BI"` / `" - Microsoft Fabric"` suffix. If the site's domain changes, only this file changes.
  - Every link to the site, including the presentation URL, is prefixed with a site locale (`/pt-BR/…`, `/en/…`) picked from the browser language by `siteLocale()`. The site (Next.js) otherwise picks its language from a sticky `NEXT_LOCALE` cookie, which sent users to e.g. the Arabic site. A locale in the path wins over the cookie and resets it. Keep `SITE_LOCALES` in sync with the site's languages (its `hreflang` alternates).
- `presentations.js` — the one way to start a presentation (`startPresentation(tab)`, `openRecent(report)`), used by the popup button, the keyboard command and the context menu. It also keeps the last 3 presented reports in `chrome.storage.local` (`recentPresentations`). It writes storage *before* `chrome.tabs.create`, because creating the tab closes the popup and would cut the write short.
- `background.js` (service worker):
  - Toolbar icon per tab: `img/icon_ready_*` (green dot drawn into the icon) on presentable reports, `img/icon_disabled_*` for `other`, `img/icon_enabled_*` otherwise. Don't use `chrome.action.setBadgeText` for the dot: Chrome's badge has a fixed size and covers half of the 16px icon. It reacts to `changeInfo.url` as well as `status: 'complete'`, because Power BI is a SPA and entering a report is often a `pushState`. On install it also sets every already-open tab.
  - Registers the `start-presentation` command (`Alt+Shift+S`) and a page context menu limited to report URLs. When either fires on a non-presentable page it calls `chrome.action.openPopup()` so the popup explains why.
  - Chrome silently refuses some suggested shortcuts (e.g. `Alt+Shift+P` ended up unassigned). After changing `suggested_key`, check `chrome.commands.getAll()`.
- `index.html` + `popup.js` — the popup. `index.html` has one `<section data-view="…">` per context kind, all `hidden`; `popup.js` un-hides the one matching `getPageContext`. The recents list (excluding the current report), compositions tip and footer show in every view. The shortcut hint reads the live binding from `chrome.commands.getAll()`, since users can rebind it in `chrome://extensions/shortcuts`.
- Links in the popup use `data-link="<key of LINKS>"`; `popup.js` fills `href`/`target`. Don't hardcode URLs in the HTML.
- Permissions are kept minimal: `activeTab`, `tabs`, `storage`, `contextMenus`, no host permissions. Avoid adding any that trigger a new permission warning, because Chrome disables the updated extension for existing users until they re-approve. `storage` and `contextMenus` trigger none.
- Light theme only — dark mode was deliberately removed. Design tokens are CSS variables at the top of `style.css`; fonts are the system stack (no remote fonts).

## Localization

- Strings live in `_locales/<locale>/messages.json`, one folder per language the site has: `en` (default), `pt_BR`, `es`, `fr`, `de`, `it`, `nl`, `ar`. Every key must exist in every file, and `package.py` refuses to build otherwise. Terms follow the site's dictionaries (Workspace stays in English, Compositions is the feature name). The store only offers a listing language for a folder that exists here.
- `direction` (`ltr`/`rtl`) sets `<html dir>` in the popup. Arabic is laid out right to left: physical `left`/`right` in `style.css` must be logical properties, and Arabic text gets no letter-spacing (it breaks the joined letters).
- `manifest.json` uses Chrome's native `__MSG_key__` substitution. The popup uses `data-i18n="key"` (sets `textContent`) and `data-i18n-attr="attr:key"` (sets an attribute), applied by `localize()` in `popup.js`.
- The `locale` message (`en` / `pt-BR`) is what `Intl` formatting and `<html lang>` use, so relative times match the language Chrome actually picked from `_locales` (not the browser UI language, which may have no locale folder).

## Assets

- `img/icon_{enabled,disabled,ready}_{16,32,48,128}.png` and `img/icon_512.png` are generated (PIL script, not in the repo): amber rounded tile with a play triangle and slide-indicator dots. `ready` adds a green dot with a white ring in the bottom-right corner.
- Chrome Web Store assets, not packaged:
  - `img/Screenshot_{1,2,3}_<lang>.png` (1280×800, one set per store language) are generated by `store-assets/` (see its README): the real popup rendered in each language, and mock-ups of the site's settings modal and composition editor labelled from the site's dictionaries.
  - `img/promo_small_440x280.png` and `img/promo_marquee_1400x560.png` combine an AI-generated background (no text) with the logo and tagline rendered as HTML.
