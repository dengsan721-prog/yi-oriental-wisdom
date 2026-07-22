#!/usr/bin/env python3
"""Generate and independently verify the compact Yi TGH core asset.

The source archives/PDF are inputs only and are never copied into the repository.
Both PDF extractors must independently recover the complete official index/UCS
mapping before the generated module is written.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import zipfile
from pathlib import Path

import pdfplumber
import pypdf
from pypdf import PdfReader


UNICODE_VERSION = "17.0.0"
GENERATED_ON = "2026-07-22"
UNIHAN_URL = "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip"
UNIHAN_SHA256 = "f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e"
OFFICIAL_URL = "https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/202103/W020210318300204215237.pdf"
OFFICIAL_SHA256 = "0ff0890afc34c5e486edeebafb05350dec69a7bf0d1d75044d7d3f7b722ec3d0"
SEQUENCE_SHA256 = "d84e2bb7979b36a2fe130a300f978b235386acef5b6202bf4cff90ef6fa1c74b"
EXPECTED_COUNT = 8105
MAX_GZIP_BYTES = 160 * 1024
OFFICIAL_TOKEN = re.compile(r"(?<!\d)(\d{4})\s+([0-9A-F]{5})(?![0-9A-F])")
KEPT_FIELDS = {
    "kTGH",
    "kTGHZ2013",
    "kMandarin",
    "kRSUnicode",
    "kTotalStrokes",
    "kTraditionalVariant",
    "kSimplifiedVariant",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_checksum(path: Path, expected: str) -> None:
    actual = sha256_file(path)
    if actual != expected:
        raise RuntimeError(f"checksum mismatch for {path}: expected {expected}, got {actual}")


def validate_official_entries(label: str, entries: list[tuple[int, int]]) -> dict[int, int]:
    if len(entries) != EXPECTED_COUNT:
        raise RuntimeError(f"{label} extracted {len(entries)} rows, expected {EXPECTED_COUNT}")
    mapping: dict[int, int] = {}
    for index, code_point in entries:
        if index in mapping:
            raise RuntimeError(f"{label} duplicated official index {index}")
        mapping[index] = code_point
    expected_indexes = set(range(1, EXPECTED_COUNT + 1))
    if set(mapping) != expected_indexes:
        missing = sorted(expected_indexes - set(mapping))
        extra = sorted(set(mapping) - expected_indexes)
        raise RuntimeError(f"{label} index mismatch: missing={missing[:20]} extra={extra[:20]}")
    return mapping


def token_entries(text: str) -> list[tuple[int, int]]:
    return [(int(index), int(code_point, 16)) for index, code_point in OFFICIAL_TOKEN.findall(text)]


def extract_official_with_pypdf(path: Path) -> dict[int, int]:
    reader = PdfReader(path)
    if reader.is_encrypted and reader.decrypt("") == 0:
        raise RuntimeError("pypdf could not open the official PDF with its empty user password")
    entries: list[tuple[int, int]] = []
    for page in reader.pages:
        entries.extend(token_entries(page.extract_text() or ""))
    return validate_official_entries("pypdf", entries)


def extract_official_with_pdfplumber(path: Path) -> dict[int, int]:
    entries: list[tuple[int, int]] = []
    with pdfplumber.open(path, password="") as document:
        for page in document.pages:
            entries.extend(token_entries(page.extract_text() or ""))
    return validate_official_entries("pdfplumber", entries)


def parse_unihan(path: Path) -> tuple[dict[int, int], dict[str, dict[str, str]]]:
    properties: dict[str, dict[str, str]] = {}
    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.endswith(".txt"):
                continue
            for line in archive.read(name).decode("utf-8").splitlines():
                if not line or line.startswith("#"):
                    continue
                code_point, field, value = line.split("\t", 2)
                if field in KEPT_FIELDS:
                    properties.setdefault(code_point, {})[field] = value

    by_index: dict[int, int] = {}
    for code_point, fields in properties.items():
        raw_tgh = fields.get("kTGH")
        if raw_tgh is None:
            continue
        match = re.fullmatch(r"2013:(\d+)", raw_tgh)
        if match is None:
            raise RuntimeError(f"unexpected kTGH value for {code_point}: {raw_tgh}")
        index = int(match.group(1))
        if index in by_index:
            raise RuntimeError(f"Unihan duplicated kTGH index {index}")
        by_index[index] = int(code_point.removeprefix("U+"), 16)

    if set(by_index) != set(range(1, EXPECTED_COUNT + 1)):
        raise RuntimeError("Unihan kTGH does not contain the exact 1..8105 index sequence")
    return by_index, properties


def selected_readings(fields: dict[str, str]) -> tuple[str, list[str]]:
    if "kTGHZ2013" in fields:
        property_name = "kTGHZ2013"
        readings = [token.rsplit(":", 1)[1] for token in fields["kTGHZ2013"].split()]
    elif "kMandarin" in fields:
        property_name = "kMandarin"
        readings = fields["kMandarin"].split()
    else:
        return "", []
    return property_name, list(dict.fromkeys(readings))


def variant_code_points(raw_value: str) -> str:
    return ",".join(token.removeprefix("U+") for token in raw_value.split())


def build_payload(
    official: dict[int, int], properties: dict[str, dict[str, str]]
) -> tuple[str, dict[str, int]]:
    rows: list[str] = []
    reading_counts = {"kTGHZ2013": 0, "kMandarin": 0}
    for index in range(1, EXPECTED_COUNT + 1):
        code_point = official[index]
        key = f"U+{code_point:04X}"
        fields = properties.get(key, {})
        required = ["kTGH", "kRSUnicode", "kTotalStrokes"]
        missing = [field for field in required if field not in fields]
        if missing:
            raise RuntimeError(f"missing {missing} for {key}")
        reading_property, readings = selected_readings(fields)
        if not readings:
            raise RuntimeError(f"missing preferred/fallback reading for {key}")
        reading_counts[reading_property] += 1
        rows.append(
            "|".join(
                [
                    f"{code_point:X}",
                    reading_property,
                    ",".join(readings),
                    fields["kRSUnicode"],
                    fields["kTotalStrokes"],
                    variant_code_points(fields.get("kTraditionalVariant", "")),
                    variant_code_points(fields.get("kSimplifiedVariant", "")),
                ]
            )
        )
    return "\n".join(rows) + "\n", reading_counts


def node_gzip_bytes(payload: str) -> int:
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "--eval",
            'import { readFileSync } from "node:fs"; '
            'import { gzipSync } from "node:zlib"; '
            'process.stdout.write(String(gzipSync(readFileSync(0), { level: 9 }).length));',
        ],
        input=payload.encode("utf-8"),
        check=True,
        capture_output=True,
    )
    return int(result.stdout)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--unihan", type=Path, required=True)
    parser.add_argument("--official-pdf", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    validate_checksum(args.unihan, UNIHAN_SHA256)
    validate_checksum(args.official_pdf, OFFICIAL_SHA256)

    pypdf_mapping = extract_official_with_pypdf(args.official_pdf)
    pdfplumber_mapping = extract_official_with_pdfplumber(args.official_pdf)
    extractor_conflicts = [
        index
        for index in range(1, EXPECTED_COUNT + 1)
        if pypdf_mapping[index] != pdfplumber_mapping[index]
    ]
    if extractor_conflicts:
        raise RuntimeError(f"PDF extractors disagree at indexes {extractor_conflicts[:20]}")

    unihan_mapping, properties = parse_unihan(args.unihan)
    unihan_mismatches = [
        index
        for index in range(1, EXPECTED_COUNT + 1)
        if pypdf_mapping[index] != unihan_mapping[index]
    ]
    if unihan_mismatches:
        raise RuntimeError(f"official PDF and Unihan disagree at indexes {unihan_mismatches[:20]}")

    sequence = "".join(
        f"{index:04d}\t{pypdf_mapping[index]:05X}\n" for index in range(1, EXPECTED_COUNT + 1)
    )
    sequence_sha256 = hashlib.sha256(sequence.encode("utf-8")).hexdigest()
    if sequence_sha256 != SEQUENCE_SHA256:
        raise RuntimeError(f"official sequence checksum changed: {sequence_sha256}")

    payload, reading_counts = build_payload(pypdf_mapping, properties)
    payload_gzip_bytes = node_gzip_bytes(payload)
    if payload_gzip_bytes > MAX_GZIP_BYTES:
        raise RuntimeError(f"compact payload gzip size {payload_gzip_bytes} exceeds {MAX_GZIP_BYTES}")

    metadata = {
        "unicodeVersion": UNICODE_VERSION,
        "generatedOn": GENERATED_ON,
        "sequenceSha256": sequence_sha256,
        "payloadGzipBytes": payload_gzip_bytes,
        "readingSelection": {
            "preferredProperty": "kTGHZ2013",
            "fallbackProperty": "kMandarin",
            "preferredCount": reading_counts["kTGHZ2013"],
            "fallbackCount": reading_counts["kMandarin"],
        },
        "unihan": {"url": UNIHAN_URL, "sha256": UNIHAN_SHA256},
        "officialTgh": {
            "url": OFFICIAL_URL,
            "sha256": OFFICIAL_SHA256,
            "document": "GF 0023-2020 通用规范汉字笔顺规范（含《字表》序号/UCS）",
        },
        "officialVerification": {
            "extractors": [f"pypdf@{pypdf.__version__}", f"pdfplumber@{pdfplumber.__version__}"],
            "recordCount": EXPECTED_COUNT,
            "extractorAgreementCount": EXPECTED_COUNT,
            "extractorConflictCount": 0,
            "unihanMismatchCount": 0,
        },
    }
    generated = (
        "// Generated by scripts/generate-yi-name-data.py. Do not edit by hand.\n"
        'import type { NameDataGenerationMetadata } from "./name-types";\n\n'
        f"export const NAME_TGH_GENERATION_METADATA = {json.dumps(metadata, ensure_ascii=False, indent=2)} as const satisfies NameDataGenerationMetadata;\n\n"
        f"export const NAME_TGH_COMPACT_PAYLOAD = {json.dumps(payload, ensure_ascii=False)};\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(generated, encoding="utf-8", newline="\n")
    print(
        json.dumps(
            {
                "records": EXPECTED_COUNT,
                "sequenceSha256": sequence_sha256,
                "payloadGzipBytes": payload_gzip_bytes,
                "extractorConflicts": 0,
                "unihanMismatches": 0,
                "output": str(args.output),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
