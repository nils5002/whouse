from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


CATEGORY_IPADS = "iPads"
CATEGORY_NOTEBOOKS = "Notebooks"
CATEGORY_SMARTPHONES = "Smartphones"
CATEGORY_QR_SCANNERS = "QR-Code-Scanner"
CATEGORY_HANDHELDS = "Handhelds"
CATEGORY_PRINTERS = "Drucker"
CATEGORY_CARD_PRINTERS = "Kartendrucker"
CATEGORY_SWITCHES = "Switches"
CATEGORY_ROUTERS = "Router"
CATEGORY_LTE_ROUTERS = "LTE-Router"
CATEGORY_MISC = "Sonstiges"


@dataclass(frozen=True, slots=True)
class CategoryRule:
    category: str
    keywords: tuple[str, ...]


FILE_HINT_RULES: tuple[CategoryRule, ...] = (
    CategoryRule(CATEGORY_SWITCHES, ("switch",)),
    CategoryRule(CATEGORY_LTE_ROUTERS, ("lte",)),
    CategoryRule(CATEGORY_NOTEBOOKS, ("notebook", "laptop")),
    CategoryRule(CATEGORY_IPADS, ("ipad",)),
    CategoryRule(CATEGORY_QR_SCANNERS, ("qrcode", "qr", "scanner")),
    CategoryRule(CATEGORY_CARD_PRINTERS, ("kartendrucker", "cardprinter")),
    CategoryRule(CATEGORY_HANDHELDS, ("handheld",)),
    CategoryRule(CATEGORY_PRINTERS, ("laserdrucker", "drucker", "printer")),
)

RULES: tuple[CategoryRule, ...] = (
    CategoryRule(
        category=CATEGORY_CARD_PRINTERS,
        keywords=("kartendrucker", "card printer", "datacard", "entrust sigma", "entrust", "sd260"),
    ),
    CategoryRule(
        category=CATEGORY_QR_SCANNERS,
        keywords=(
            "qr-code-scanner",
            "qr scanner",
            "barcode-scanner",
            "barcode scanner",
            "mk-7000",
            "albasca",
            "sumeber",
            "zebra ds",
        ),
    ),
    CategoryRule(
        category=CATEGORY_HANDHELDS,
        keywords=("handheld", "handhelden", "mobile computer", "ct30", "honeywell ct", "m3 mobile"),
    ),
    CategoryRule(category=CATEGORY_IPADS, keywords=("ipad", "tablet", "apple tablet")),
    CategoryRule(
        category=CATEGORY_NOTEBOOKS,
        keywords=(
            "notebook",
            "laptop",
            "macbook",
            "thinkpad",
            "lenovo t",
            "lenovo e",
            "latitude",
            "elitebook",
        ),
    ),
    CategoryRule(
        category=CATEGORY_SMARTPHONES,
        keywords=("smartphone", "iphone", "samsung galaxy", "pixel", "moto", "android phone"),
    ),
    CategoryRule(
        category=CATEGORY_SWITCHES,
        keywords=("switch", "switches", "dgs-", "dlink dgs", "netgear gs"),
    ),
    CategoryRule(
        category=CATEGORY_LTE_ROUTERS,
        keywords=("lte", "speedbox", "archer mr", "rutx", "teltonika", "4g router", "5g router"),
    ),
    CategoryRule(
        category=CATEGORY_ROUTERS,
        keywords=("router", "fritzbox", "edge router", "tp-link archer", "gateway"),
    ),
    CategoryRule(
        category=CATEGORY_PRINTERS,
        keywords=("drucker", "laserdrucker", "laserjet", "brother hl", "kyocera pa", "printer"),
    ),
)


def categorize_hardware(
    *,
    file_name: str,
    name: str,
    model: str | None,
    description: str | None = None,
) -> str:
    file_hint = _categorize_by_file_name(file_name)
    if file_hint:
        return file_hint

    haystack = _build_haystack(file_name=file_name, name=name, model=model, description=description)
    for rule in RULES:
        if _matches_any(haystack, rule.keywords):
            return rule.category
    return CATEGORY_MISC


def _categorize_by_file_name(file_name: str) -> str | None:
    normalized = file_name.lower().replace("_", " ").replace("-", " ")
    for rule in FILE_HINT_RULES:
        if _matches_any(normalized, rule.keywords):
            return rule.category
    return None


def _build_haystack(
    *,
    file_name: str,
    name: str,
    model: str | None,
    description: str | None,
) -> str:
    parts = [file_name, name, model or "", description or ""]
    normalized = " | ".join(parts).lower()
    return normalized.replace("_", " ").replace("-", " ")


def _matches_any(haystack: str, keywords: Iterable[str]) -> bool:
    for raw in keywords:
        keyword = raw.strip().lower()
        if keyword and keyword in haystack:
            return True
    return False

