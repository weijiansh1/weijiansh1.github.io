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


def image_tag(url, description, width, height, css_class="", lazy=False):
    attrs = ""
    if isinstance(description, dict):
        attrs = f' data-en="{esc(description["en"])}" data-zh="{esc(description["zh"])}" data-translate-attribute="alt"'
        description = description["en"]
    if lazy:
        attrs += ' loading="lazy"'
    return f'<img class="{esc(css_class)}" src="{safe_url(url, local=True)}" alt="{esc(description)}" width="{width}" height="{height}" decoding="async"{attrs}>'


def build():
    profile = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))
    research = []
    for item in profile["research"]:
        if item["icon"] not in {"embodied", "experts", "learning"}:
            raise ValueError("Choose one of the three research icons: embodied, experts, learning")
        research.append(
            f'<article class="research-item research-{esc(item["icon"])}">'
            f'<div class="research-icon">{icon(item["icon"])}</div>'
            f'{localized(item["title"], "h3")}{localized(item["description"], "p")}'
            + (localized(item["keywords"], "p", ' class="research-keywords"') if item.get("keywords") else "")
            + '</article>'
        )

    projects = []
    for item in profile["projects"]:
        questions = "".join(
            f'<li><span class="question-number" aria-hidden="true">{i:02d}</span>{localized(q)}</li>'
            for i, q in enumerate(item.get("questions", []), 1)
        )
        details = (
            '<details class="project-details" open><summary>' +
            localized({"en": "Research questions", "zh": "研究问题"}) +
            icon("plus") + f'</summary><ol role="list">{questions}</ol></details>'
        ) if questions else ""
        links = "".join(external_link(link["url"], link["label"]) for link in item.get("links", []))
        thumbnail = (
            image_tag(item["image"], item.get("image_alt", item["name"]), 352, 264, lazy=True)
            if item.get("image") else f'<span class="project-wordmark">{esc(item["name"])}</span>'
        )
        projects.append(
            '<article class="project"><div class="project-main">'
            f'<div class="project-visual">{thumbnail}</div><div class="project-content">'
            f'<div class="project-meta"><span class="project-name">{esc(item["name"])}</span>'
            + localized(item["status"], "span", ' class="project-status"')
            + f'</div>{localized(item["title"], "h3")}{localized(item["description"], "p")}'
            + (f'<div class="project-links">{links}</div>' if links else "")
            + f'</div></div>{details}</article>'
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
        '<div class="section-heading">'
        + localized({"en": "Publications", "zh": "学术论文"}, "h2", ' id="publications-title"')
        + '<span class="heading-rule" aria-hidden="true"></span></div><div class="publication-list">'
        + "".join(publications) + '</div></section>'
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
        "PORTRAIT": (
            '<figure class="profile-portrait"><div class="portrait-frame">'
            + image_tag(profile["portrait"], profile["name"], 224, 224, "portrait")
            + '</div><span class="portrait-sprig" aria-hidden="true">'
            + icon("sprout") + '</span></figure>'
        ) if profile.get("portrait") else "",
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
