#!/usr/bin/env python3
"""Build the homepage with Python's standard library; no install step required."""

import json
import shutil
from datetime import date
from html import escape
from pathlib import Path
from string import Template
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


def esc(value):
    return escape(str(value), quote=True)


def localized(value, tag="span", attrs=""):
    if isinstance(value, str):
        return f"<{tag}{attrs}>{esc(value)}</{tag}>"
    en, zh = value["en"], value["zh"]
    return f'<{tag}{attrs} data-en="{esc(en)}" data-zh="{esc(zh)}">{esc(en)}</{tag}>'


def safe_url(value, local=False):
    if not value:
        return ""
    parsed = urlsplit(value)
    if parsed.scheme == "https" and parsed.netloc and not parsed.username:
        return esc(value)
    if local and not parsed.scheme and not parsed.netloc and value.startswith("assets/"):
        path = (ROOT / parsed.path).resolve()
        if path.is_relative_to(ROOT / "assets") and path.is_file():
            return esc(value)
    raise ValueError(f"Expected an HTTPS URL or an existing assets/ file: {value!r}")


def icon(name, small=False):
    return f'<svg class="icon{" small" if small else ""}" aria-hidden="true"><use href="#icon-{esc(name)}"/></svg>'


def external_link(url, label, css_class="text-link"):
    return f'<a class="{css_class}" href="{safe_url(url, local=True)}" target="_blank" rel="noopener noreferrer">{localized(label)}{icon("external", True)}</a>'


def build():
    profile = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    research = []
    for item in profile["research"]:
        if item["icon"] not in {"embodied", "experts", "learning"}:
            raise ValueError("Choose one of the three research icons: embodied, experts, learning")
        research.append(
            '<article class="research-card"><div class="research-card-top">'
            f'{icon(item["icon"])}<span class="research-number">{esc(item["number"])}</span></div>'
            f'{localized(item["title"], "h3")}{localized(item["description"], "p")}'
            + localized(item["tags"], "div", ' class="research-tags"') + '</article>'
        )

    projects = []
    for item in profile["projects"]:
        questions = "".join(localized(q, "li") for q in item.get("questions", []))
        details = (
            '<details class="project-details"><summary>' + icon("plus") +
            localized({"en": "Inside this research", "zh": "了解研究内容"}) +
            f'</summary><ul>{questions}</ul></details>'
        ) if questions else ""
        links = "".join(external_link(link["url"], link["label"]) for link in item.get("links", []))
        projects.append(
            '<article class="project"><div class="project-main">'
            f'<div class="project-visual" aria-hidden="true"><span class="project-wordmark">{esc(item["name"])}</span>'
            '<span class="project-visual-caption">Observe · Understand · Adapt</span></div>'
            '<div class="project-content"><div class="project-meta">'
            f'<span class="project-label">{esc(item["name"])}</span>'
            + localized(item["status"], "span", ' class="project-status"') + '</div>'
            + f'{localized(item["title"], "h3")}{localized(item["description"], "p")}{details}'
            + (f'<div class="project-links">{links}</div>' if links else "") + '</div></div></article>'
        )

    publications = []
    for item in profile["publications"]:
        links = "".join(external_link(link["url"], link["label"]) for link in item.get("links", []))
        publications.append(
            '<article class="publication">'
            f'<span class="publication-year">{esc(item["year"])}</span><div>'
            f'{localized(item["title"], "h3")}<p>{esc(item["authors"])}</p>'
            + localized(item["venue"], "p", ' class="venue"')
            + (f'<div class="project-links">{links}</div>' if links else "") + '</div></article>'
        )
    publications_section = (
        '<section class="section" id="publications" aria-labelledby="publications-title">'
        '<div class="section-heading"><div><p class="eyebrow"><span class="section-index">03 /</span>'
        + localized({"en": "Publications", "zh": "学术论文"}) + '</p>'
        + localized({"en": "Selected publications.", "zh": "论文成果。"}, "h2", ' id="publications-title"')
        + '</div></div><div class="publication-list">' + "".join(publications) + '</div></section>'
    ) if publications else ""
    publications_nav = (
        '<a class="nav-link" href="#publications" data-en="Publications" data-zh="论文">Publications</a>'
    ) if publications else ""

    email_link = ""
    if profile.get("email"):
        email = profile["email"].strip()
        if "@" not in email or any(c.isspace() for c in email):
            raise ValueError("Please use a complete email address without whitespace")
        email_link = (
            f'<a class="text-link" href="mailto:{esc(quote(email, safe="@.+-_"))}">{icon("mail")}{esc(email)}</a>'
        )

    structured_data = {
        "@context": "https://schema.org", "@type": "Person", "name": profile["name"],
        "affiliation": {"@type": "Organization", "name": profile["affiliation"]["en"]},
        "sameAs": [profile["github"]] + ([profile["scholar"]] if profile.get("scholar") else []),
    }
    values = {
        "NAME": esc(profile["name"]),
        "PAGE_TITLE": esc(f'{profile["name"]} | {profile["affiliation"]["en"]}'),
        "DESCRIPTION_EN": esc(profile["description"]["en"]),
        "DESCRIPTION_ZH": esc(profile["description"]["zh"]),
        "AFFILIATION": localized(profile["affiliation"]),
        "AFFILIATION_URL": safe_url(profile["affiliation_url"]),
        "GITHUB": safe_url(profile["github"]),
        "INTRO": localized(profile["intro"]), "BIO": localized(profile["bio"]),
        "RESEARCH": "\n".join(research), "PROJECTS": "\n".join(projects),
        "PUBLICATIONS": publications_section, "PUBLICATIONS_NAV": publications_nav,
        "CONTACT": localized(profile["contact"]), "EMAIL_LINK": email_link,
        "CV_LINK": external_link(profile["cv"], {"en": "CV", "zh": "简历"}) if profile.get("cv") else "",
        "SCHOLAR_LINK": external_link(profile["scholar"], "Google Scholar") if profile.get("scholar") else "",
        "PORTRAIT": f'<img class="portrait" src="{safe_url(profile["portrait"], local=True)}" alt="{esc(profile["name"])}" width="440" height="310">' if profile.get("portrait") else "",
        "STRUCTURED_DATA": json.dumps(structured_data, ensure_ascii=False).replace("<", "\\u003c"),
        "YEAR": str(date.today().year),
    }
    html = Template((ROOT / "templates/index.html").read_text(encoding="utf-8")).substitute(values)
    html = "\n".join(line.rstrip() for line in html.splitlines()) + "\n"
    (ROOT / "index.html").write_text(html, encoding="utf-8")
    output = ROOT / "dist"
    output.mkdir(exist_ok=True)
    shutil.copy2(ROOT / "index.html", output / "index.html")
    shutil.copy2(ROOT / ".nojekyll", output / ".nojekyll")
    if (output / "assets").exists():
        shutil.rmtree(output / "assets")
    shutil.copytree(ROOT / "assets", output / "assets")
    print(f'Built index.html and dist/ — {len(research)} research areas, {len(projects)} project(s), {len(publications)} publication(s).')


if __name__ == "__main__":
    build()
