"""Builds dist/power-slider-<version>.zip for the Chrome Web Store.

Only the files the extension loads go in (store screenshots, promo tiles and docs stay out), and the
build fails if anything the manifest, popup or scripts reference is missing.

Usage: python package.py
"""
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
ICON_STATES = ('enabled', 'disabled', 'ready')  # see background.js
ICON_SIZES = (16, 32, 48, 128)


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


def main():
    files = package_files()
    missing = sorted(f for f in set(files) | referenced_files() if not (ROOT / f).is_file() or f not in files)
    if missing:
        raise SystemExit(f'Missing from package: {missing}')

    version = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))['version']
    out = ROOT / 'dist' / f'power-slider-{version}.zip'
    out.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(ROOT / f, f)
    print(f'{out.relative_to(ROOT)}  ({len(files)} files, {out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
