# -*- coding: utf-8 -*-
"""
duck_jobs_scrape.py
----------------------------------
Search DuckDuckGo for Thai job postings (local communities) and produce:
  1) duck_results_raw.csv     : raw search hits (query, title, url, snippet, domain)
  2) jobs_cleaned.csv         : filtered + extracted fields (job_term, wage, unit, location, etc.)
  3) role_examples.csv        : ready for ontology team (role_id blank for later mapping)

Usage:
  python duck_jobs_scrape_v2.py --queries "หางาน ปทุมธานี facebook" "รับสมัครงาน รังสิต" \\
                                --max 80 --outfile-prefix "ptn"

Install:
  pip install ddgs pandas beautifulsoup4 tldextract python-slugify

Notes:
  - We do NOT fetch content from facebook.com (respect ToS). We only store URL/title/snippet.
  - For non-Facebook domains we don't fetch body either in this script (fast version).
"""

import argparse
import csv
import re
import sys
import time
from pathlib import Path
from typing import List, Tuple, Dict

import pandas as pd
import tldextract
from slugify import slugify

try:
    from ddgs import DDGS   # new package name
except Exception:
    from duckduckgo_search import DDGS

JOB_KEYWORDS = r"(รับสมัคร|ประกาศงาน|หางาน|สมัครงาน|พนักงาน|พาร์ทไทม์|Part.?time|รายวัน|รายชั่วโมง|รายเดือน|ค่าแรง|ค่าจ้าง|เงินเดือน|ด่วน)"
DAY_PAT      = r"(?:วันละ|รายวัน|ต่อวัน|/ ?วัน)\s*(\d{2,6})"
MONTH_PAT    = r"(?:เดือนละ|รายเดือน|ต่อเดือน|/ ?เดือน)\s*(\d{3,6})"
HOUR_PAT     = r"(?:ชั่วโมงละ|รายชั่วโมง|ต่อชั่วโมง|/ ?ชั่วโมง)\s*(\d{2,6})"
BAHT_ANY     = r"(\d[\d,\.]{2,6})\s*(?:บาท|฿)"
RANGE_PAT    = r"(\d[\d,\.]{2,6})\s*[-–—]\s*(\d[\d,\.]{2,6})"

LOCATIONS = [
    "ปทุมธานี","รังสิต","นนทบุรี","คลองหลวง","ธัญบุรี","ลำลูกกา","สามโคก",
    "เมืองปทุมธานี","ตลาดรังสิต","ฟิวเจอร์พาร์ค","บึงยี่โถ",
    "คลองหนึ่ง","คลองสอง","คลองสาม","คลองสี่","คลองห้า",
    "ดอนเมือง","อยุธยา","แจ้งวัฒนะ","ติวานนท์","บางบัวทอง","บางใหญ่","บางกรวย",
    "ปากเกร็ด","ศรีสมาน","สะพานใหม่","นวนคร","มธ.รังสิต","ธรรมศาสตร์รังสิต"]
LOC_RE = re.compile("|".join(map(re.escape, LOCATIONS)))

TERM2CAT = {
    "บาริสต้า":"บริการ","ชงกาแฟ":"บริการ","พนักงานขาย":"ขาย","แคชเชียร์":"บริการ",
    "แม่บ้าน":"ทำความสะอาด","ทำความสะอาด":"ทำความสะอาด","แม่ครัว":"ครัว/อาหาร","ผู้ช่วยครัว":"ครัว/อาหาร",
    "ส่งของ":"ขับรถ/ส่งของ","ขับรถ":"ขับรถ/ส่งของ","ไรเดอร์":"ขับรถ/ส่งของ","พนักงานส่งของ":"ขับรถ/ส่งของ",
    "ช่างไฟ":"ช่างฝีมือ","ช่างแอร์":"ช่างฝีมือ","ช่างซ่อม":"ช่างฝีมือ","ช่าง":"ช่างฝีมือ",
    "พนักงานคลังสินค้า":"คลังสินค้า/โลจิสติกส์","คลังสินค้า":"คลังสินค้า/โลจิสติกส์",
    "แพ็คของ":"คลังสินค้า/โลจิสติกส์","แพคของ":"คลังสินค้า/โลจิสติกส์",
    "พนักงานเสิร์ฟ":"บริการ","เสิร์ฟ":"บริการ","ร้านกาแฟ":"บริการ","ร้านอาหาร":"ครัว/อาหาร",
    "แอดมิน":"แอดมิน/ออฟฟิศ","เอกสาร":"แอดมิน/ออฟฟิศ","พนักงานร้านสะดวกซื้อ":"ค้าปลีก","เซเว่น":"ค้าปลีก",
}
TERM_RE = re.compile("|".join(map(re.escape, TERM2CAT.keys())), re.IGNORECASE)

BLOCKED_DOMAINS = {"facebook.com","m.facebook.com","web.facebook.com","fb.com","fb.me","instagram.com"}

def domain_of(url: str) -> str:
    ext = tldextract.extract(url)
    return ".".join(p for p in [ext.domain, ext.suffix] if p)

def extract_wage(text: str):
    if not text: return (None, None, "")
    s = text
    m = re.search(RANGE_PAT, s)
    if m:
        lo = int(m.group(1).replace(","," ").split(".")[0].replace(" ",""))
        hi = int(m.group(2).replace(","," ").split(".")[0].replace(" ",""))
        unit = "month" if re.search(MONTH_PAT, s) else ("day" if re.search(DAY_PAT, s) else ("hour" if re.search(HOUR_PAT, s) else "unknown"))
        if unit == "unknown":
            if hi <= 2000: unit = "day"
            elif hi <= 80000: unit = "month"
        return lo, hi, unit
    m = re.search(DAY_PAT, s)
    if m: 
        v = int(m.group(1)); return v, v, "day"
    m = re.search(MONTH_PAT, s)
    if m:
        v = int(m.group(1)); return v, v, "month"
    m = re.search(HOUR_PAT, s)
    if m:
        v = int(m.group(1)); return v, v, "hour"
    m = re.search(BAHT_ANY, s)
    if m:
        val = int(m.group(1).replace(","," ").split(".")[0].replace(" ",""))
        unit = "day" if val <= 1500 else ("month" if val <= 80000 else "unknown")
        return val, val, unit
    return (None, None, "")

def find_locations(text: str):
    return list({m.group(0) for m in LOC_RE.finditer(text or "")})

def guess_term_cat(text: str):
    if not text: return (None, None)
    ms = list(TERM_RE.finditer(text))
    if not ms: return (None, None)
    term = max(ms, key=lambda m: len(m.group(0))).group(0)
    key = next((k for k in TERM2CAT if k.lower()==term.lower()), term)
    return term, TERM2CAT.get(key)

def ddg_search(queries, max_results):
    seen = set()
    rows = []
    with DDGS() as ddgs:
        for q in queries:
            for r in ddgs.text(q, region="th-th", safesearch="Off", timelimit=None, max_results=max_results):
                url = r.get("href") or r.get("url")
                title = r.get("title","")
                body = r.get("body","")
                if not url or url in seen: 
                    continue
                seen.add(url)
                dom = domain_of(url)
                rows.append({"query": q, "title": title, "snippet": body, "url": url, "domain": dom})
                time.sleep(0.05)
    return pd.DataFrame(rows)

def filter_and_extract(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["text"] = (df["title"].fillna("") + " — " + df["snippet"].fillna("")).str.strip(" —")
    df["is_job_like"] = df["text"].str.contains(JOB_KEYWORDS, flags=re.IGNORECASE, regex=True)
    df = df[df["is_job_like"]].copy()
    df[["wage_min","wage_max","wage_unit"]] = df["text"].apply(lambda s: pd.Series(extract_wage(s)))
    df["locations"] = df["text"].apply(lambda s: ", ".join(find_locations(s)))
    df[["job_term","job_category"]] = df["text"].apply(lambda s: pd.Series(guess_term_cat(s)))
    return df

def export_role_examples(clean: pd.DataFrame, out_path: Path):
    role_examples = pd.DataFrame({
        "role_id": "",
        "example_text": clean["text"].fillna(""),
        "source_hint": clean["url"].fillna(""),
        "location_hint": clean["locations"].fillna(""),
    })
    role_examples.to_csv(out_path, index=False, encoding="utf-8-sig")
    return role_examples

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--queries", nargs="+", required=False, default=[
        "หางาน ปทุมธานี facebook", "รับสมัครงาน รังสิต facebook",
        "งานพาร์ทไทม์ นนทบุรี facebook", "ประกาศรับสมัครงาน คลองหลวง facebook"
    ])
    parser.add_argument("--max", type=int, default=80)
    parser.add_argument("--outfile-prefix", type=str, default="duck")
    args = parser.parse_args()

    prefix = slugify(args.outfile_prefix) or "duck"
    out_raw = Path(f"{prefix}_duck_results_raw.csv")
    out_clean = Path(f"{prefix}_jobs_cleaned.csv")
    out_examples = Path(f"{prefix}_role_examples.csv")

    print(f"[1/3] Searching DuckDuckGo … ({len(args.queries)} queries, {args.max} per query)")
    raw = ddg_search(args.queries, args.max)
    if raw.empty:
        print("No results. Try different queries or increase --max")
        return
    raw.to_csv(out_raw, index=False, encoding="utf-8-sig")
    print(f"Saved raw -> {out_raw} ({len(raw)} rows)")

    print("[2/3] Filtering & extracting fields …")
    clean = filter_and_extract(raw)
    clean.to_csv(out_clean, index=False, encoding="utf-8-sig")
    print(f"Saved cleaned -> {out_clean} ({len(clean)} rows)")

    print("[3/3] Writing role_examples.csv …")
    export_role_examples(clean, out_examples)
    print(f"Saved role_examples -> {out_examples} ({len(clean)} rows)")
    print("Done. Next: map job_term → role_id and append to your ontology tables.")

if __name__ == "__main__":
    main()
