import os, re, glob, yaml

BRIEF_PATH = r"C:\Users\matty\Real Wealth\Real Wealth\Content Brief - Wealth Conversation.md"
CONTENT_DIR = r"C:\Users\matty\Real Wealth\Real Wealth\master_template\content"
REPORT_PATH = r"C:\Users\matty\Real Wealth\Real Wealth\master_template\CONTENT_QA.md"

# Banned words from Voice and Tone "No hype"
BANNED_WORDS = [
    "unlock", "supercharge", "transform", "guaranteed", "proven", "revolutionary",
    "#1 secret", "top advisers don't want you to know", "act now", "only 3 spots left",
    "you could be losing thousands", "before it's too late", "click here", "book today",
    "scary", "daunting", "nightmare",
]

VOICE_RULES_FILE = "microcopy\\voice-rules.md"

def read_file(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

def parse_md(path):
    text = read_file(path)
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            try:
                front = yaml.safe_load(parts[1])
            except Exception:
                front = {}
            body = parts[2]
        else:
            front = {}
            body = text
    else:
        front = {}
        body = text
    return front, body

def strip_md(text):
    # remove markdown emphasis asterisks and underscores used for italics/bold
    text = re.sub(r'(?<!\*)\*\*(?!\*)', '', text)
    text = re.sub(r'(?<!\*)\*(?!\*)', '', text)
    text = re.sub(r'(?<!_)__(?!_)', '', text)
    text = re.sub(r'(?<!_)_(?!_)', '', text)
    return text

def norm(text):
    return " ".join(strip_md(text).split())

bt = read_file(BRIEF_PATH)

# --- Screens ---
screen_lines = re.findall(r"###\s+Screen\s+([0-9A-Za-z.]+)\s*[—-]?\s*([^\n\r]*)", bt)
screen_lines2 = re.findall(r"####\s+Screen\s+([0-9A-Za-z.]+)\s*[—-]?\s*([^\n\r]*)", bt)
brief_screens = {}
for sid, title in screen_lines + screen_lines2:
    brief_screens[sid.strip()] = title.strip()

# --- Awareness checks ---
aware_entries = re.findall(r"####\s+\d+\.\d+\s+—?\s*([^\n\*]+)\*?\s*`(pitfall\.[^`]+)`", bt)
brief_awareness = {aid.strip(): title.strip() for title, aid in aware_entries}

# --- Provocations ---
# More robust: match "### 6.N ... — `prov.xxx`" allowing multiple em dashes in title
prov_entries = re.findall(r"###\s+6\.\d+\s+(.+?)\s+—\s*`(prov\.[^`]+)`", bt)
brief_provocations = {pid.strip(): title.strip() for title, pid in prov_entries}

# --- Segments ---
seg_block = bt.split("### 8.5 CTA block — nine segment variants")[1].split("### 8.6 FCA footer")[0]
brief_segments = {}
for line in seg_block.splitlines():
    m = re.match(r"####\s+(S\d+)\s+—", line)
    if m:
        brief_segments[m.group(1)] = line.strip()
    m2 = re.match(r"####\s+Overlay\s+—\s+`([^`]+)`", line)
    if m2:
        oid = m2.group(1).strip().lower().replace(" = true", "").replace(" ", "_")
        brief_segments[oid] = line.strip()
    m3 = re.match(r"####\s+Overlay\s+—\s+urgency\s*=\s+\*This week\*", line)
    if m3:
        brief_segments["urgency_this_week"] = line.strip()

microcopy_groups = ["errors", "toasts", "modals", "progress", "meta", "aria", "emails", "loading-states", "voice-rules"]

# Read content
content_screens = {}
for p in glob.glob(os.path.join(CONTENT_DIR, "screens", "*.md")):
    fname = os.path.basename(p)
    front, body = parse_md(p)
    content_screens[fname] = {"front": front, "body": body, "path": p}

content_awareness = {}
for p in glob.glob(os.path.join(CONTENT_DIR, "awareness-checks", "*.md")):
    fname = os.path.basename(p)
    front, body = parse_md(p)
    content_awareness[fname] = {"front": front, "body": body, "path": p}

content_provocations = {}
for p in glob.glob(os.path.join(CONTENT_DIR, "provocations", "*.md")):
    fname = os.path.basename(p)
    front, body = parse_md(p)
    content_provocations[fname] = {"front": front, "body": body, "path": p}

content_segments = {}
for p in glob.glob(os.path.join(CONTENT_DIR, "segments", "*.md")):
    fname = os.path.basename(p)
    front, body = parse_md(p)
    content_segments[fname] = {"front": front, "body": body, "path": p}

content_microcopy = {}
for p in glob.glob(os.path.join(CONTENT_DIR, "microcopy", "*.md")):
    fname = os.path.basename(p)
    front, body = parse_md(p)
    content_microcopy[fname] = {"front": front, "body": body, "path": p}

# Map content IDs
screen_content_ids = {}
for fname, data in content_screens.items():
    sn = data["front"].get("screen_number", "")
    if sn:
        screen_content_ids[sn] = fname
    else:
        m = re.match(r"([0-9A-Za-z.]+)-", fname)
        if m:
            screen_content_ids[m.group(1)] = fname

aware_content_ids = {}
for fname, data in content_awareness.items():
    aid = data["front"].get("id", "")
    if aid:
        aware_content_ids[aid] = fname
    else:
        base = fname.replace(".md", "")
        aware_content_ids[base] = fname

prov_content_ids = {}
for fname, data in content_provocations.items():
    pid = data["front"].get("id", "")
    if pid:
        prov_content_ids[pid] = fname
    else:
        base = fname.replace(".md", "")
        prov_content_ids[base] = fname

seg_content_ids = {}
for fname, data in content_segments.items():
    sid = data["front"].get("id", "")
    if sid:
        seg_content_ids[sid] = fname
    else:
        base = fname.replace(".md", "")
        seg_content_ids[base] = fname

micro_content_groups = set(fname.replace(".md", "") for fname in content_microcopy.keys())

missing_screens = sorted(set(brief_screens.keys()) - set(screen_content_ids.keys()))
extra_screens = sorted(set(screen_content_ids.keys()) - set(brief_screens.keys()))
missing_aware = sorted(set(brief_awareness.keys()) - set(aware_content_ids.keys()))
extra_aware = sorted(set(aware_content_ids.keys()) - set(brief_awareness.keys()))
missing_prov = sorted(set(brief_provocations.keys()) - set(prov_content_ids.keys()))
extra_prov = sorted(set(prov_content_ids.keys()) - set(brief_provocations.keys()))
missing_seg = sorted(set(brief_segments.keys()) - set(seg_content_ids.keys()))
extra_seg = sorted(set(seg_content_ids.keys()) - set(brief_segments.keys()))
missing_micro = sorted(set(microcopy_groups) - micro_content_groups)
extra_micro = sorted(micro_content_groups - set(microcopy_groups))

# Awareness body extraction
def extract_awareness_body(body):
    parts = {}
    current = None
    buffer = []
    for line in body.splitlines():
        m = re.match(r"^#\s+(Stem|Aware body|Partial body|Unaware body)\s*$", line, re.IGNORECASE)
        if m:
            if current:
                parts[current] = "\n".join(buffer).strip()
            current = m.group(1).lower().replace(" ", "_")
            buffer = []
        else:
            buffer.append(line)
    if current:
        parts[current] = "\n".join(buffer).strip()
    return parts

# Provocation body extraction
def extract_provocation_body(body):
    parts = {}
    current = None
    buffer = []
    for line in body.splitlines():
        m = re.match(r"^#\s+(Headline|Body|Close)\s*$", line, re.IGNORECASE)
        if m:
            if current:
                parts[current] = "\n".join(buffer).strip()
            current = m.group(1).lower()
            buffer = []
        else:
            buffer.append(line)
    if current:
        parts[current] = "\n".join(buffer).strip()
    return parts

# Extract brief awareness texts
brief_aware_text = {}
for m in re.finditer(r"####\s+\d+\.\d+\s+—?\s*[^\n\*]+\*?\s*`(pitfall\.[^`]+)`", bt):
    start = m.start()
    end_match = re.search(r"\n(?=####\s+\d+\.\d+|###\s+\n|##\s+\d+\.)", bt[start:])
    end = start + end_match.start() if end_match else len(bt)
    block = bt[start:end]
    aid = m.group(1).strip()
    parts = {}
    for sec in ["Stem", "Aware body", "Partial body", "Unaware body"]:
        pat = re.compile(rf"\*\*{sec}\*\*.*?\n\n>\s*(.+?)(?=\n\n\*\*|\n####|\n###\s|\\Z)", re.DOTALL)
        mat = pat.search(block)
        if mat:
            text = mat.group(1).strip()
            text = re.sub(r"^>\s?", "", text, flags=re.MULTILINE)
            # Drop trailing annotation lines like *(...)* that are not part of the copy
            lines_text = text.splitlines()
            while lines_text and re.match(r"^\*\(.+\)\*$", lines_text[-1].strip()):
                lines_text.pop()
            text = " ".join(" ".join(lines_text).split())
            parts[sec.lower().replace(" ", "_")] = text
    brief_aware_text[aid] = parts

aware_divergences = []
for aid, bparts in brief_aware_text.items():
    if aid not in aware_content_ids:
        continue
    fname = aware_content_ids[aid]
    cparts = extract_awareness_body(content_awareness[fname]["body"])
    for sec in ["stem", "aware_body", "partial_body", "unaware_body"]:
        btext = norm(bparts.get(sec, ""))
        ctext = norm(cparts.get(sec, ""))
        if btext and ctext and btext != ctext:
            aware_divergences.append({"id": aid, "file": fname, "section": sec, "brief": btext, "content": ctext})

# Extract brief provocation texts
brief_prov_text = {}
for m in re.finditer(r"###\s+6\.\d+\s+(.+?)\s+—\s*`(prov\.[^`]+)`", bt):
    start = m.start()
    end_match = re.search(r"\n(?=###\s+6\.\d+|##\s+\d+\.)", bt[start:])
    end = start + end_match.start() if end_match else len(bt)
    block = bt[start:end]
    pid = m.group(2).strip()
    parts = {}
    for sec in ["Headline", "Body", "Close"]:
        pat = re.compile(rf"\*\*{sec}:\*\*\s*(.+?)(?=\n\n\*\*|\n###\s|\\Z)", re.DOTALL)
        mat = pat.search(block)
        if mat:
            text = mat.group(1).strip()
            text = " ".join(text.split())
            parts[sec.lower()] = text
    brief_prov_text[pid] = parts

prov_divergences = []
for pid, bparts in brief_prov_text.items():
    if pid not in prov_content_ids:
        continue
    fname = prov_content_ids[pid]
    cparts = extract_provocation_body(content_provocations[fname]["body"])
    for sec in ["headline", "body", "close"]:
        btext = norm(bparts.get(sec, ""))
        ctext = norm(cparts.get(sec, ""))
        if btext and ctext and btext != ctext:
            prov_divergences.append({"id": pid, "file": fname, "section": sec, "brief": btext, "content": ctext})

# Voice and tone audit
voice_hits = []
for root, _, files in os.walk(CONTENT_DIR):
    for f in files:
        if not f.endswith(".md"):
            continue
        relpath = os.path.relpath(os.path.join(root, f), CONTENT_DIR)
        if relpath.replace("/", "\\") == VOICE_RULES_FILE:
            continue
        text = read_file(os.path.join(root, f))
        for word in BANNED_WORDS:
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            for m in pattern.finditer(text):
                start = max(m.start() - 30, 0)
                end = min(m.end() + 30, len(text))
                phrase = text[start:end].replace("\n", " ")
                voice_hits.append({"file": relpath, "word": word, "phrase": phrase.strip()})

# Compliance-tag health
compliance_counts = {"draft": 0, "cfp_signed": 0, "compliance_signed": 0, "approved_to_ship": 0, "missing": 0}
missing_compliance_files = []
for fname, data in content_provocations.items():
    status = data["front"].get("compliance_status")
    if not status:
        compliance_counts["missing"] += 1
        missing_compliance_files.append(fname)
    elif status in compliance_counts:
        compliance_counts[status] += 1
    else:
        compliance_counts["missing"] += 1
        missing_compliance_files.append(fname)

# Overall verdict
total_brief_entries = len(brief_screens) + len(brief_awareness) + len(brief_provocations) + len(brief_segments) + len(microcopy_groups)
missing_total = len(missing_screens) + len(missing_aware) + len(missing_prov) + len(missing_seg) + len(missing_micro)
divergence_total = len(aware_divergences) + len(prov_divergences)
if total_brief_entries > 0:
    faith_pct = round(((total_brief_entries - missing_total) / total_brief_entries) * 100)
else:
    faith_pct = 0

priorities = []
if missing_total > 0:
    priorities.append(f"close {missing_total} coverage gap(s)")
if divergence_total > 0:
    priorities.append(f"reconcile {divergence_total} wording divergence(s)")
if compliance_counts["missing"] > 0:
    priorities.append(f"add compliance_status to {compliance_counts['missing']} provocation(s)")
if not priorities:
    priorities.append("final compliance sign-off on provocations")

# Build report
lines = []
lines.append("# CONTENT_QA — Reconciliation Report")
lines.append("")
lines.append("## Overall verdict")
lines.append("")
lines.append(
    f"The content folder is {faith_pct}% faithful to the brief. "
    f"{missing_total} entries are missing. {divergence_total} entries diverge in wording. "
    f"Top priority to fix: {', '.join(priorities)}."
)
lines.append("")

lines.append("## 1. Coverage")
lines.append("")

def cov(name, bc, cc, miss, extra):
    lines.append(f"### {name}")
    lines.append(f"| Metric | Value |")
    lines.append(f"|---|---|")
    lines.append(f"| Brief count | {bc} |")
    lines.append(f"| Content count | {cc} |")
    lines.append(f"| Missing | {', '.join(miss) if miss else '—'} |")
    lines.append(f"| Extra | {', '.join(extra) if extra else '—'} |")
    lines.append("")

cov("Screens", len(brief_screens), len(content_screens), missing_screens, extra_screens)
cov("Awareness checks", len(brief_awareness), len(content_awareness), missing_aware, extra_aware)
cov("Provocations", len(brief_provocations), len(content_provocations), missing_prov, extra_prov)
cov("Segments", len(brief_segments), len(content_segments), missing_seg, extra_seg)
cov("Microcopy", len(microcopy_groups), len(content_microcopy), missing_micro, extra_micro)

lines.append("## 2. Wording divergence")
lines.append("")
lines.append(f"### Awareness checks ({len(aware_divergences)} divergences)")
lines.append("")
if aware_divergences:
    lines.append("| ID | File | Section | Brief | Content |")
    lines.append("|---|---|---|---|---|")
    for d in aware_divergences[:20]:
        b = d['brief'][:120].replace('|', '\\|')
        c = d['content'][:120].replace('|', '\\|')
        lines.append(f"| {d['id']} | {d['file']} | {d['section']} | {b} | {c} |")
    if len(aware_divergences) > 20:
        lines.append(f"| … | … | … | ({len(aware_divergences)-20} more) | |")
else:
    lines.append("*No wording divergence detected.*")
lines.append("")

lines.append(f"### Provocations ({len(prov_divergences)} divergences)")
lines.append("")
if prov_divergences:
    lines.append("| ID | File | Section | Brief | Content |")
    lines.append("|---|---|---|---|---|")
    for d in prov_divergences[:20]:
        b = d['brief'][:120].replace('|', '\\|')
        c = d['content'][:120].replace('|', '\\|')
        lines.append(f"| {d['id']} | {d['file']} | {d['section']} | {b} | {c} |")
    if len(prov_divergences) > 20:
        lines.append(f"| … | … | … | ({len(prov_divergences)-20} more) | |")
else:
    lines.append("*No wording divergence detected.*")
lines.append("")

lines.append("## 3. Voice and tone audit")
lines.append("")
if voice_hits:
    lines.append("| File | Banned word / phrase | Context |")
    lines.append("|---|---|---|")
    seen = set()
    for h in voice_hits:
        key = (h['file'], h['word'], h['phrase'])
        if key in seen:
            continue
        seen.add(key)
        phrase = h['phrase'].replace('|', '\\|')
        lines.append(f"| {h['file']} | {h['word']} | {phrase} |")
else:
    lines.append("*No banned words found.*")
lines.append("")

lines.append("## 4. Compliance-tag health")
lines.append("")
lines.append("| Status | Count |")
lines.append("|---|---|")
for st in ["draft", "cfp_signed", "compliance_signed", "approved_to_ship", "missing"]:
    lines.append(f"| {st} | {compliance_counts[st]} |")
lines.append("")
if missing_compliance_files:
    lines.append("**Missing `compliance_status`:** " + ", ".join(missing_compliance_files))
    lines.append("")

lines.append("---")
lines.append("*End of report.*")

report = "\n".join(lines)
with open(REPORT_PATH, "w", encoding="utf-8") as f:
    f.write(report)

print("Report written to", REPORT_PATH)
print("Missing total:", missing_total)
print("Divergence total:", divergence_total)
print("Aware divergences:", len(aware_divergences))
print("Prov divergences:", len(prov_divergences))
print("Voice hits:", len(voice_hits))
print("Compliance missing:", compliance_counts["missing"])
