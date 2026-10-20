"""Assembles what each store's dashboard asks for, per language, into dist/store/<store>/:

  chrome/<lang>/  description.txt, 1-3.png (1280x800)
  edge/<lang>/    description.txt, search-terms.txt, logo-300.png, 1-3.png (1280x800)
  opera/<lang>/   summary.txt, description.txt, 1-3.png (800x500)
  firefox/<lang>/ summary.txt, description.txt, 1-3.png (1280x800)
  <store>/_all-languages/  images shared by every language

The descriptions come from store-listing.md, the screenshots from img/ (see README.md), the
search terms from search-terms.json and the Opera and Firefox summaries from each _locales folder. The build
fails if a text breaks a store's limit.

Usage: python store-assets/make-kits.py
"""
import json
import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist' / 'store'

STORES = ('chrome', 'edge', 'opera', 'firefox')

# _locales folder -> suffix of img/Screenshot_<n>_<suffix>.png, in store-listing.md order.
LANGS = {'en': 'en', 'pt_BR': 'pt', 'es': 'es', 'fr': 'fr', 'de': 'de', 'it': 'it', 'nl': 'nl', 'ar': 'ar'}


def descriptions():
    """The blockquote under each '### ' heading of store-listing.md, in LANGS order."""
    text = (ROOT / 'store-listing.md').read_text(encoding='utf-8')
    blocks = re.findall(r'^### .+?\n\n((?:^>.*\n)+)', text, flags=re.M)
    if len(blocks) != len(LANGS):
        raise SystemExit(f'store-listing.md has {len(blocks)} descriptions, expected {len(LANGS)}')
    return {
        lang: '\n'.join(re.sub(r'^> ?', '', line) for line in block.rstrip('\n').split('\n')) + '\n'
        for lang, block in zip(LANGS, blocks)
    }


def summary(lang):
    messages = json.loads((ROOT / '_locales' / lang / 'messages.json').read_text(encoding='utf-8'))
    return messages['extensionDescription']['message'] + '\n'


def check_search_terms(lang, terms):
    """Edge: at most 7 terms of up to 30 characters, 21 words in all."""
    words = sum(len(t.split()) for t in terms)
    long = [t for t in terms if len(t) > 30]
    if len(terms) > 7 or words > 21 or long:
        raise SystemExit(f'{lang}: search terms break Edge limits ({len(terms)} terms, {words} words, too long: {long})')


def resized(src, dst, size):
    with Image.open(src) as im:
        im.convert('RGB' if im.mode != 'RGBA' else 'RGBA').resize(size, Image.LANCZOS).save(dst, optimize=True)


def main():
    texts = descriptions()
    terms = json.loads((Path(__file__).parent / 'search-terms.json').read_text(encoding='utf-8'))
    if terms.keys() != LANGS.keys():
        raise SystemExit(f'search-terms.json languages differ: {sorted(terms.keys() ^ LANGS.keys())}')
    for lang, text in texts.items():
        if not 250 <= len(text) <= 10000:
            raise SystemExit(f'{lang}: description has {len(text)} characters (Edge needs 250 to 10000)')
        check_search_terms(lang, terms[lang])

    if OUT.exists():
        shutil.rmtree(OUT)
    img = ROOT / 'img'
    for store in STORES:
        shared = OUT / store / '_all-languages'
        shared.mkdir(parents=True)
        shutil.copy(img / 'promo_small_440x280.png', shared / 'small-promo-440x280.png')
        shutil.copy(img / 'promo_marquee_1400x560.png', shared / 'marquee-1400x560.png')
    shutil.copy(img / 'icon_enabled_128.png', OUT / 'chrome' / '_all-languages' / 'store-icon-128.png')
    resized(img / 'icon_512.png', OUT / 'edge' / '_all-languages' / 'logo-300.png', (300, 300))
    shutil.copy(img / 'icon_enabled_128.png', OUT / 'opera' / '_all-languages' / 'icon-128.png')
    resized(img / 'icon_512.png', OUT / 'opera' / '_all-languages' / 'icon-64.png', (64, 64))
    shutil.copy(img / 'icon_enabled_128.png', OUT / 'firefox' / '_all-languages' / 'icon-128.png')

    for lang, suffix in LANGS.items():
        shots = [img / f'Screenshot_{n}_{suffix}.png' for n in (1, 2, 3)]
        for store in STORES:
            folder = OUT / store / lang
            folder.mkdir()
            (folder / 'description.txt').write_text(texts[lang], encoding='utf-8')
            for n, shot in enumerate(shots, 1):
                if store == 'opera':
                    # Opera takes screenshots up to 800x600; 800x500 keeps the 16:10 slides whole.
                    resized(shot, folder / f'{n}.png', (800, 500))
                else:
                    shutil.copy(shot, folder / f'{n}.png')
        (OUT / 'edge' / lang / 'search-terms.txt').write_text('\n'.join(terms[lang]) + '\n', encoding='utf-8')
        shutil.copy(OUT / 'edge' / '_all-languages' / 'logo-300.png', OUT / 'edge' / lang / 'logo-300.png')
        for store in ('opera', 'firefox'):
            (OUT / store / lang / 'summary.txt').write_text(summary(lang), encoding='utf-8')

    for store in STORES:
        print(f'{(OUT / store).relative_to(ROOT)}: {len(LANGS)} languages')


if __name__ == '__main__':
    main()
