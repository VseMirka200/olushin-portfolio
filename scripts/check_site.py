"""Check local HTML references and the award gallery catalog without dependencies."""

from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
REFERENCE_ATTRIBUTES = {"href", "src", "data-img", "data-project-src"}
AWARD_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".pdf"}


class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in REFERENCE_ATTRIBUTES and value:
                self.references.append((name, value.strip()))


def check_html(errors):
    pages = sorted(ROOT.rglob("*.html"))
    reference_count = 0
    for page in pages:
        parser = ReferenceParser()
        parser.feed(page.read_text(encoding="utf-8-sig"))
        for attribute, reference in parser.references:
            url = urlsplit(reference)
            if url.scheme or url.netloc or not url.path:
                continue  # External links, mailto:, data:, and fragment-only links.

            reference_count += 1
            path = unquote(url.path)
            target = (ROOT / path.lstrip("/") if path.startswith("/") else page.parent / path).resolve()
            try:
                target.relative_to(ROOT)
            except ValueError:
                errors.append(f"{page.relative_to(ROOT)}: {attribute}={reference!r} выходит за пределы проекта")
                continue
            if not target.is_file():
                errors.append(f"{page.relative_to(ROOT)}: {attribute}={reference!r} — файл не найден")

    return len(pages), reference_count


def check_awards(errors):
    script = ROOT / "assets/js/main.js"
    source = script.read_text(encoding="utf-8")
    catalog = re.search(r"const ACHIEVEMENT_FILES\s*=\s*Object\.freeze\(\s*\{(.*?)\}\s*\)\s*;", source, re.S)
    if not catalog:
        errors.append("assets/js/main.js: каталог ACHIEVEMENT_FILES не найден")
        return 0

    total = 0
    for group in ("teacher", "students"):
        match = re.search(rf"\b{group}:\s*\[(.*?)\]", catalog.group(1), re.S)
        if not match:
            errors.append(f"assets/js/main.js: отсутствует каталог {group}")
            continue

        entries = re.findall(r"'([^']+)'", match.group(1))
        total += len(entries)
        if len(entries) != len(set(entries)):
            errors.append(f"assets/js/main.js: повторяющиеся файлы в каталоге {group}")

        directory = ROOT / "content/achievements" / group
        actual = {
            str(file.relative_to(directory)).replace("\\", "/")
            for file in directory.rglob("*")
            if file.is_file() and file.suffix.lower() in AWARD_EXTENSIONS
        } if directory.is_dir() else set()
        listed = set(entries)
        for name in sorted(listed - actual):
            errors.append(f"{group}: в каталоге указан отсутствующий файл {name}")
        for name in sorted(actual - listed):
            errors.append(f"{group}: файл не добавлен в каталог {name}")

    return total


def main():
    errors = []
    pages, references = check_html(errors)
    awards = check_awards(errors)
    if errors:
        print("Проверка сайта завершилась с ошибками:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(f"Проверка пройдена: {pages} HTML-страниц, {references} локальных ссылок, {awards} наград.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
