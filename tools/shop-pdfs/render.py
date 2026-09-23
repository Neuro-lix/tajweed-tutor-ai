#!/usr/bin/env python3
"""Génère les PDF de la boutique (16 fiches x langue) depuis tools/shop-pdfs/content/<lang>.json.

Dépendances : reportlab, arabic_reshaper, python-bidi (pip install arabic_reshaper python-bidi).
Usage : python3 tools/shop-pdfs/render.py fr en ar id ms
Sortie : tools/shop-pdfs/out/<lang>/<fichier>.pdf
"""
import json, os, re, subprocess, sys
import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle, ListFlowable, ListItem)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
GOLD = colors.HexColor("#B8860B")
GREEN = colors.HexColor("#1A5F1A")
DARK = colors.HexColor("#222222")


def register(query, name):
    path = subprocess.check_output(["fc-match", "-f", "%{file}", query], text=True).strip()
    pdfmetrics.registerFont(TTFont(name, path))


register("DejaVu Sans", "Body")
register("DejaVu Sans:bold", "BodyB")
HAS_AR = False
for q in ("Noto Naskh Arabic", "Noto Sans Arabic UI", "Amiri"):
    try:
        register(q, "Arabic")
        HAS_AR = True
        break
    except Exception:
        continue

AR_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF]")
AR_RUN = re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\u064B-\u0652\s]*"
                    r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF]"
                    r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\u064B-\u0652\s]*")


def ar(text):
    return get_display(arabic_reshaper.reshape(str(text)))


def has_ar(text):
    return bool(AR_RE.search(str(text)))


def esc(t):
    return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def mixed(text):
    """Ligne latine contenant des mots arabes : chaque segment arabe passe en police arabe."""
    out, last, s = [], 0, str(text)
    for m in AR_RUN.finditer(s):
        out.append(esc(s[last:m.start()]))
        run = m.group(0)
        lead = " " if run[:1].isspace() else ""
        trail = " " if run[-1:].isspace() else ""
        out.append(f'{lead}<font name="Arabic">{esc(ar(run.strip()))}</font>{trail}')
        last = m.end()
    out.append(esc(s[last:]))
    return "".join(out)


def styles(rtl):
    algn = 2 if rtl else 0
    base = "Arabic" if (rtl and HAS_AR) else "Body"
    baseb = "Arabic" if (rtl and HAS_AR) else "BodyB"
    return {
        "title": ParagraphStyle("t", fontName=baseb, fontSize=20, leading=25, textColor=GREEN, alignment=1),
        "sub": ParagraphStyle("s", fontName=base, fontSize=11, leading=15, textColor=colors.grey, alignment=1),
        "h": ParagraphStyle("h", fontName=baseb, fontSize=13, leading=17, textColor=GREEN,
                            spaceBefore=10, spaceAfter=4, alignment=algn),
        "p": ParagraphStyle("p", fontName=base, fontSize=10, leading=14.5, textColor=DARK, alignment=algn),
        "li": ParagraphStyle("li", fontName=base, fontSize=10, leading=14, textColor=DARK, alignment=algn),
        "arab": ParagraphStyle("ar", fontName="Arabic" if HAS_AR else "Body", fontSize=15, leading=24,
                               textColor=DARK, alignment=2),
        "small": ParagraphStyle("sm", fontName=base, fontSize=8.5, leading=12, textColor=colors.grey, alignment=algn),
    }


BRAND = "Nassihah · TajweedTutorAI"


def decorate(canvas, doc, title):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1.6)
    canvas.rect(10 * mm, 10 * mm, w - 20 * mm, h - 20 * mm)
    canvas.setLineWidth(0.4)
    canvas.rect(12 * mm, 12 * mm, w - 24 * mm, h - 24 * mm)
    canvas.setFillColor(GOLD)
    for x, y in ((12 * mm, 12 * mm), (w - 12 * mm, 12 * mm), (12 * mm, h - 12 * mm), (w - 12 * mm, h - 12 * mm)):
        canvas.circle(x, y, 1.6 * mm, fill=1, stroke=0)
    canvas.setFont("Body", 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(16 * mm, 14.5 * mm, BRAND)
    canvas.drawRightString(w - 16 * mm, 14.5 * mm, str(doc.page))
    canvas.setFillColor(GREEN)
    canvas.setFont("BodyB", 8)
    canvas.drawCentredString(w / 2, h - 15.5 * mm, title[:70])
    canvas.restoreState()


def build(sheet, lang, rtl):
    st = styles(rtl)
    fname = os.path.join(OUT, lang, sheet["file"])
    os.makedirs(os.path.dirname(fname), exist_ok=True)
    title = sheet["title"]
    doc = BaseDocTemplate(fname, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                          topMargin=22 * mm, bottomMargin=20 * mm, title=title, author=BRAND)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame],
                                       onPage=lambda c, d: decorate(c, d, title))])

    def T(x):
        return ar(x) if rtl else (mixed(x) if has_ar(x) else esc(x))

    def P(x, key):
        return Paragraph(T(x), st[key])

    flow = [Paragraph(T(title), st["title"]), Spacer(1, 3 * mm),
            Paragraph(T(sheet.get("subtitle", "")), st["sub"]), Spacer(1, 5 * mm),
            P(sheet.get("intro", ""), "p")]

    for sec in sheet.get("sections", []):
        flow.append(P(sec.get("heading", ""), "h"))
        if sec.get("body"):
            flow.append(P(sec["body"], "p"))
        if sec.get("bullets"):
            flow.append(ListFlowable([ListItem(P(b, "li"), leftIndent=8) for b in sec["bullets"]],
                                     bulletType="bullet", start="•", leftIndent=12))
        tbl = sec.get("table")
        if tbl and tbl.get("headers"):
            data = [[P(str(c), "li") for c in tbl["headers"]]]
            data += [[P(str(c), "li") for c in row] for row in tbl.get("rows", [])]
            ncol = len(tbl["headers"])
            t = Table(data, colWidths=[doc.width / ncol] * ncol, hAlign="LEFT")
            t.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CCCCCC")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F6F1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]))
            flow += [Spacer(1, 2 * mm), t, Spacer(1, 2 * mm)]
        for ex in sec.get("arabicExamples", []) or []:
            if ex.get("ar"):
                flow.append(Paragraph(ar(ex["ar"]), st["arab"]))
            meta = " — ".join(x for x in (ex.get("translit"), ex.get("note")) if x)
            if meta:
                flow.append(Paragraph(T(meta), st["small"]))

    pr = sheet.get("practice") or {}
    if pr.get("lines"):
        flow.append(P(pr.get("heading", ""), "h"))
        rows = [[P(l, "li"), ""] for l in pr["lines"]]
        t = Table(rows, colWidths=[doc.width * 0.68, doc.width * 0.32])
        t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#DDDDDD")),
                               ("TOPPADDING", (0, 0), (-1, -1), 5),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        flow += [Spacer(1, 2 * mm), t]

    if sheet.get("footer"):
        flow += [Spacer(1, 6 * mm), Paragraph(T(sheet["footer"]), st["small"])]

    doc.build(flow)
    return fname


FILES = {
    "hifz-tracker": "hifz-tracker.pdf", "makharij": "makharij.pdf",
    "journal-correction": "journal-correction.pdf", "planning-revision": "planning-revision.pdf",
    "tadabbur": "tadabbur.pdf", "guide-waqf": "guide-waqf.pdf",
    "objectifs-annuels": "objectifs-annuels.pdf", "duas-coran": "duas-coran.pdf",
    "livret-1-complet": "livret-1-complet.pdf", "livret-2-complet": "livret-2-complet.pdf",
    "tajweed-idgham": "tajweed-idgham.pdf", "tajweed-ikhfa": "tajweed-ikhfa.pdf",
    "tajweed-qalqala": "tajweed-qalqala.pdf", "memorisation-al-fatiha": "memorisation-al-fatiha.pdf",
    "memorisation-al-ikhlas": "memorisation-al-ikhlas.pdf",
    "memorisation-al-falaq-an-nas": "memorisation-al-falaq-an-nas.pdf",
}

if __name__ == "__main__":
    for lang in (sys.argv[1:] or ["fr"]):
        data = json.load(open(os.path.join(HERE, "content", f"{lang}.json")))
        for sheet in data:
            sheet["file"] = FILES.get(sheet["id"], f"{sheet['id']}.pdf")
            print(build(sheet, lang, lang == "ar"))
