"""Builds the store packages:

  dist/power-slider-<version>.zip          Chrome Web Store, Edge Add-ons and Opera add-ons
  dist/power-slider-firefox-<version>.zip  Firefox Add-ons (AMO)

Only the files the extension loads go in (store screenshots, promo tiles and docs stay out), and the
build fails if anything the manifest, popup or scripts reference is missing.

Firefox runs the same code: its `chrome.*` returns promises under Manifest V3, like Chrome's. Only
the manifest differs, so the Firefox package gets a rewritten copy (see firefox_manifest).

Usage: python package.py
"""
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
ICON_STATES = ('enabled', 'disabled', 'ready')  # see background.js
ICON_SIZES = (16, 32, 48, 128)

# The id of the existing AMO listing (from the 1.x Firefox extension), so the package is an update
# to it rather than a new add-on.
FIREFOX_ID = 'b04751786a6cecd291e52bd1bf4b58e3170226e5@atomo.tec.br'


def package_files():
    files = ['manifest.json', 'index.html', 'style.css']
    files += sorted(p.name for p in ROOT.glob('*.js'))
    files += sorted(p.relative_to(ROOT).as_posix() for p in ROOT.glob('_locales/*/messages.json'))
    files += [f'img/icon_{state}_{size}.png' for state in ICON_STATES for size in ICON_SIZES]
    return files


def referenced_files():
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    refs = set(manifest['icons'].values()) | set(manifest['action']['default_icon'].values())
    refs |= {manifest['action']['default_popup'], manifest['background']['service_worker']}
    refs |= set(re.findall(r'(?:src|href)="([^"#:]+)"', (ROOT / 'index.html').read_text(encoding='utf-8')))
    for script in ROOT.glob('*.js'):
        refs |= {r[2:] for r in re.findall(r"from '(\./[^']+)'", script.read_text(encoding='utf-8'))}
    return refs


def locale_problems():
    """Every locale must carry exactly the keys of the default one (Chrome would fall back to English
    for a missing key, mid-sentence), and the manifest description has to fit the stores' 132 characters."""
    default = json.loads((ROOT / '_locales/en/messages.json').read_text(encoding='utf-8'))
    problems = []
    for path in sorted(ROOT.glob('_locales/*/messages.json')):
        messages = json.loads(path.read_text(encoding='utf-8'))
        locale = path.parent.name
        if messages.keys() != default.keys():
            problems.append(f'{locale}: keys differ from en: {sorted(messages.keys() ^ default.keys())}')
        description = messages.get('extensionDescription', {}).get('message', '')
        if len(description) > 132:
            problems.append(f'{locale}: extensionDescription has {len(description)} characters (max 132)')
    return problems


def firefox_manifest(manifest):
    """Firefox has no background service worker in Manifest V3: the same module runs as an event
    page. It also needs the add-on id, and AMO asks every add-on to declare its data collection."""
    m = dict(manifest)
    m['background'] = {'scripts': [manifest['background']['service_worker']], 'type': 'module'}
    m['browser_specific_settings'] = {
        'gecko': {
            'id': FIREFOX_ID,
            # data_collection_permissions is read from Firefox 140 on, which is also the current ESR
            # (common on company machines), so 140 rather than anything newer.
            'strict_min_version': '140.0',
            'data_collection_permissions': {'required': ['none']},
        },
        # Firefox for Android reads data_collection_permissions only from 142.
        'gecko_android': {'strict_min_version': '142.0'},
    }
    return m


def build(out, files, manifest=None):
    out.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            if f == 'manifest.json' and manifest is not None:
                zf.writestr(f, json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
            else:
                zf.write(ROOT / f, f)
    print(f'{out.relative_to(ROOT)}  ({len(files)} files, {out.stat().st_size // 1024} KB)')


def main():
    files = package_files()
    missing = sorted(f for f in set(files) | referenced_files() if not (ROOT / f).is_file() or f not in files)
    if missing:
        raise SystemExit(f'Missing from package: {missing}')
    problems = locale_problems()
    if problems:
        raise SystemExit('Locale problems:\n  ' + '\n  '.join(problems))

    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    version = manifest['version']
    build(ROOT / 'dist' / f'power-slider-{version}.zip', files)
    build(ROOT / 'dist' / f'power-slider-firefox-{version}.zip', files, firefox_manifest(manifest))


if __name__ == '__main__':
    main()
