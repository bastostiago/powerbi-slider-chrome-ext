# Store screenshots

`img/Screenshot_{1,2,3}_<lang>.png` (1280×800, one set per store language) come out of this folder:

1. `render-popups.mjs` renders the real popup ("report detected" with two recents) in every language into `popups/`, loading the extension from the repo root. It opens a visible Chrome window: headless Chrome sizes extension popups narrower than their content, which cut the Arabic one.
2. `render-slides.mjs` draws the three slides from `slides.html` into `img/`:
   1. the extension, with the popup over a report;
   2. report presentation, with the settings modal;
   3. compositions, with the composition editor.

The slide copy is in `copy.json`. The app labels in the mock-ups are in `ui-strings.json`, copied from the site's dictionaries (`src/dictionaries/*.json` in the site repo), so they match what each language really shows. `report.png` is the report behind the panels and `logo-light.svg` is the site's `public/logo-light.svg`.

Both scripts need two environment variables: `PUPPETEER_DIR`, a folder where `npm i puppeteer` was run, and `CHROME`, a Chrome for Testing `chrome.exe` (branded Chrome no longer loads unpacked extensions from the command line).

```
PUPPETEER_DIR=... CHROME=.../chrome.exe node store-assets/render-popups.mjs
PUPPETEER_DIR=... CHROME=.../chrome.exe node store-assets/render-slides.mjs
```

The slides load Inter, Sora and Noto Sans Arabic from Google Fonts, so rendering needs internet access.
