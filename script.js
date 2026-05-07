const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const fallbackData = {
    profile: {
        name: "Weijian Shi",
        name_cn: "石伟建",
        title: "Fudan University · Undergraduate",
        subtitle: "Aircraft Design and Engineering · Information and Computational Science",
        bio: [
            "Hi! I'm Weijian Shi, an undergraduate at Fudan University exploring aerospace systems, AI, and scientific computing."
        ],
        education: [],
        skills: ["Python", "C/C++", "MATLAB", "LaTeX", "Git", "Linux"],
        focus: []
    },
    projects: [],
    research: [],
    awards: [],
    blog: [],
    gallery: [],
    contact: {
        github: "https://github.com/weijiansh1",
        location: "Shanghai, China"
    }
};

if (document.body.classList.contains("home-page")) {
    fetch("data.json?v=20260507a")
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            render(data);
            initChrome(data);
            initReveal();
        })
        .catch(error => {
            console.warn("Failed to load data.json; using fallback content.", error);
            render(fallbackData);
            initChrome(fallbackData);
            initReveal();
        });
}

function render(data) {
    const profile = data.profile || fallbackData.profile;
    const contact = data.contact || fallbackData.contact;
    const { projects, awards } = normalizeCollections(data);

    renderHero(profile, contact);
    renderWorkList("work-list", projects, "Selected projects will appear here.");
    renderWorkList("awards-list", awards, "Honors and recognitions will appear here.");
    renderPractice(data.research || [], profile);
    renderAbout(profile, contact);
    renderGallery(data.gallery || []);
    renderNotes(data.blog || []);
    renderContact(contact, profile);
}

function renderHero(profile, contact) {
    const subtitle = stripHtml(profile.subtitle || "Aerospace & Computation");
    const school = profile.education?.[0]?.school || "Fudan University";

    setText("hero-summary", `${subtitle} · ${school}`);

    const heroLinks = $("#hero-links");
    if (heroLinks) {
        heroLinks.innerHTML = `
            <a class="hero-action hero-action-primary" href="#work">Projects</a>
            <a class="hero-action" href="#about">About Me</a>
            ${contact.github ? `<a class="hero-action" href="${safeUrl(contact.github)}" target="_blank" rel="noreferrer">GitHub</a>` : ""}
        `;
    }
}

function renderWorkList(targetId, items, emptyText) {
    const workList = document.getElementById(targetId);
    if (!workList) return;

    if (!items.length) {
        workList.innerHTML = `<div class="empty-copy reveal">${esc(emptyText || "Selected entries will appear here.")}</div>`;
        return;
    }

    workList.innerHTML = items.map(item => {
        const facts = Array.isArray(item.aside) ? item.aside : [];
        const links = Array.isArray(item.links) ? item.links : [];
        const visualLines = Array.isArray(item.visualLines) && item.visualLines.length
            ? item.visualLines
            : facts.slice(0, 3).map(fact => `${fact.label || ""} ${fact.value || ""}`.trim()).filter(Boolean);
        const visualTitle = item.visualTitle || item.title || "Selected work";
        const visualMeta = item.visualMeta || item.detail || item.category || "Project";
        const visualKicker = item.visualKicker || item.category || "Project";
        const visualMarkup = item.image
            ? `<div class="experience-thumb" style="background-image:url('${safeUrl(item.image)}'); background-position:${esc(item.imagePosition || "center")}"></div>`
            : `
                <div class="experience-fallback">
                    <span class="experience-fallback-kicker">${esc(visualKicker)}</span>
                    <strong>${esc(visualTitle)}</strong>
                    <p>${esc(visualMeta)}</p>
                    ${visualLines.length ? `
                        <div class="experience-fallback-lines">
                            ${visualLines.map(line => `<span>${esc(line)}</span>`).join("")}
                        </div>
                    ` : ""}
                </div>
            `;

        return `
            <article class="experience-item reveal">
                <div class="experience-meta">
                    <span>${esc(item.year || "Now")}</span>
                    <span>${esc(item.category || "Highlight")}</span>
                </div>
                <div class="experience-main">
                    <h3>${esc(item.title || "Selected highlight")}</h3>
                    ${item.detail ? `<p>${esc(item.detail)}</p>` : ""}
                    ${facts.length ? `
                        <div class="experience-facts">
                            ${facts.map(fact => `
                                <div class="experience-fact">
                                    <span>${esc(fact.label || "")}</span>
                                    <strong>${esc(fact.value || "")}</strong>
                                </div>
                            `).join("")}
                        </div>
                    ` : ""}
                    ${links.length ? `
                        <div class="experience-links">
                            ${links.map(link => `
                                <a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">${esc(link.label || "Link")} ↗</a>
                            `).join("")}
                        </div>
                    ` : ""}
                </div>
                <div class="experience-visual">
                    ${visualMarkup}
                </div>
            </article>
        `;
    }).join("");
}

function normalizeCollections(data) {
    const rawProjects = Array.isArray(data.projects) ? data.projects : [];
    const rawAwards = Array.isArray(data.awards) ? data.awards : [];

    if (rawProjects.length) {
        return {
            projects: rawProjects,
            awards: rawAwards
        };
    }

    const inferredProjects = rawAwards.filter(item => /project/i.test(String(item.category || "")));
    const inferredAwards = rawAwards.filter(item => !/project/i.test(String(item.category || "")));

    return {
        projects: inferredProjects,
        awards: inferredAwards
    };
}

function renderPractice(research, profile) {
    const intro = $("#practice-intro");
    const focusElement = $("#practice-focus");
    const researchGrid = $("#research-grid");
    const skillsCloud = $("#skills-cloud");

    if (intro) {
        intro.textContent = "I am drawn to problems where physical systems, learning methods, and computation have to work together — especially when engineering judgment matters as much as model performance.";
    }

    if (focusElement) {
        const focusItems = profile.focus || [];
        focusElement.innerHTML = `
            <p class="subsection-label reveal">Direction</p>
            ${focusItems.map(item => `
                <div class="focus-item reveal">
                    <strong>${esc(item.label || "")}</strong>
                    <span>${esc(item.text || "")}</span>
                </div>
            `).join("")}
        `;
    }

    if (researchGrid) {
        const items = research.length ? research : fallbackData.research;
        researchGrid.innerHTML = items.map((item, index) => `
            <article class="research-entry reveal">
                <div class="research-entry-index">${String(index + 1).padStart(2, "0")}</div>
                <div class="research-entry-main">
                    <h3>${esc(item.title || "Research")}</h3>
                    <p>${esc(item.desc || "")}</p>
                </div>
            </article>
        `).join("");
    }

    if (skillsCloud) {
        const skills = profile.skills || [];
        skillsCloud.innerHTML = `
            <p class="subsection-label reveal">Tools</p>
            <div class="skills-list">
                ${skills.map(skill => `
                    <span class="skill-pill reveal">${esc(skill)}</span>
                `).join("")}
            </div>
        `;
    }
}

function renderAbout(profile, contact) {
    const bio = profile.bio || [];
    const lead = $("#about-lead");
    const body = $("#about-body");
    const education = $("#about-education");
    const facts = $("#profile-facts");

    setText("about-caption", `${profile.name || "Weijian Shi"} — ${(profile.education?.[0]?.school || "Fudan University")}`);
    setText("about-place", (contact.location || "Shanghai, China").split("\n")[0]);
    setText("profile-nameplate", `${profile.name_cn || "石伟建"} / ${profile.name || "Weijian Shi"}`);
    setText("profile-trackline", stripHtml(profile.subtitle || profile.title || "Aerospace and Computation"));

    if (lead) {
        const leadText = firstSentence(stripHtml(bio[1] || bio[0] || ""));
        lead.textContent = leadText || "I am building a foundation across aerospace engineering, mathematics, and computation.";
    }

    if (body) {
        const paragraphs = bio.length > 1 ? bio.filter((_, index) => index !== 1) : bio;
        body.innerHTML = paragraphs.map(item => `<p>${item}</p>`).join("");
    }

    if (facts) {
        const factItems = [
            { label: "University", value: profile.education?.[0]?.school || "Fudan University" },
            { label: "Program", value: profile.subtitle || "Aerospace and Computation" },
            { label: "Base", value: (contact.location || "Shanghai, China").split("\n")[0] },
            { label: "Status", value: profile.title || "Undergraduate" }
        ];

        facts.innerHTML = factItems.map(item => `
            <div class="profile-fact">
                <span>${esc(item.label)}</span>
                <strong>${esc(item.value)}</strong>
            </div>
        `).join("");
    }

    if (education) {
        const items = profile.education || [];
        education.innerHTML = items.length ? items.map(item => `
            <div class="timeline-item">
                <div class="timeline-date">${esc(item.date || "Now")}</div>
                <div class="timeline-main">
                    <h4>${esc(item.school || "")}</h4>
                    ${item.degree ? `<p>${esc(item.degree).replace(/\n/g, "<br>")}</p>` : ""}
                </div>
                <div class="timeline-side">${esc(item.detail || "").replace(/\n/g, "<br>")}</div>
            </div>
        `).join("") : `<div class="empty-copy">Education details will appear here.</div>`;
    }
}

function renderGallery(gallery) {
    const grid = $("#gallery-grid");
    if (!grid) return;

    if (!gallery.length) {
        grid.innerHTML = `<div class="empty-copy reveal">Photos and moments will appear here.</div>`;
        return;
    }

    grid.innerHTML = gallery.map((item, index) => `
        <div class="gallery-item reveal" data-index="${index}" onclick="openLightbox(${index})">
            <img src="${safeUrl(item.image)}" alt="${esc(item.caption || "")}" loading="lazy">
            <div class="gallery-caption">
                <strong>${esc(item.caption || "")}</strong>
                <span>${esc(item.date || "")}</span>
            </div>
        </div>
    `).join("");

    window._galleryData = gallery;
}

function renderNotes(posts) {
    const notesGrid = $("#notes-grid");
    if (!notesGrid) return;

    if (!posts.length) {
        notesGrid.innerHTML = `<div class="empty-copy reveal">Short logs and study notes will appear here.</div>`;
        return;
    }

    notesGrid.innerHTML = posts.map(post => `
        <a class="note-row reveal" href="${safeUrl(post.url || "#")}">
            <div class="note-row-date">${esc(post.date || "Draft")}</div>
            <div class="note-row-main">
                <h3>${esc(post.title || "Untitled note")}</h3>
                <p>${esc(post.desc || "")}</p>
            </div>
            <div class="note-row-tags">
                ${(post.tags || []).map(tag => `<span>${esc(tag)}</span>`).join("")}
            </div>
        </a>
    `).join("");
}

function renderContact(contact, profile) {
    const primary = $("#contact-primary");
    const grid = $("#contact-grid");

    const primaryHref = contact.email ? `mailto:${contact.email}` : (contact.github || "https://github.com/weijiansh1");
    const primaryText = contact.email || (contact.github ? contact.github.replace(/^https?:\/\//, "") : "github.com/weijiansh1");

    if (primary) {
        primary.href = safeUrl(primaryHref);
        if (safeUrl(primaryHref).startsWith("http")) {
            primary.target = "_blank";
            primary.rel = "noreferrer";
        }
        primary.innerHTML = `${esc(primaryText)} <span>→</span>`;
    }

    setText("footer-note", `${(contact.location || "Shanghai").split("\n")[0]} · Fudan University`);

    if (!grid) return;

    const items = [];
    if (contact.github) items.push({ label: "GitHub", value: contact.github.replace(/^https?:\/\//, ""), href: contact.github });
    if (contact.email) items.push({ label: "Email", value: contact.email, href: `mailto:${contact.email}` });
    items.push({ label: "University", value: profile.education?.[0]?.school || "Fudan University" });
    items.push({ label: "Field", value: stripHtml(profile.subtitle || "Aerospace and Computation") });
    items.push({ label: "Base", value: (contact.location || "Shanghai, China").split("\n")[0] });

    grid.innerHTML = items.map(item => `
        <div class="contact-item reveal">
            <div class="label">${esc(item.label)}</div>
            ${item.href
                ? `<a class="value" href="${safeUrl(item.href)}" ${safeUrl(item.href).startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>${esc(item.value)}</a>`
                : `<div class="value">${esc(item.value)}</div>`
            }
        </div>
    `).join("");
}

/* ===== Chrome / Interactive features ===== */

function initChrome(data) {
    initNav();
    initActiveLinks();
    initThemeToggle();
    initBackToTop();
    initReadingProgress();
}

function initNav() {
    const navbar = $("#navbar");
    const navToggle = $("#nav-toggle");
    const navLinks = $("#nav-links");

    const updateScrolled = () => {
        navbar?.classList.toggle("is-scrolled", window.scrollY > 40);
    };

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    navToggle?.addEventListener("click", () => {
        const isOpen = navLinks?.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });

    navLinks?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("is-open");
            navToggle?.setAttribute("aria-expanded", "false");
        });
    });
}

function initActiveLinks() {
    const sections = $$("main section[id]");
    const links = $$(".nav-links a");
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver(entries => {
        const active = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!active) return;
        const id = active.target.id;
        links.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
    }, {
        rootMargin: "-20% 0px -45% 0px",
        threshold: [0.2, 0.45, 0.7]
    });

    sections.forEach(section => observer.observe(section));
}

function initThemeToggle() {
    const toggle = $("#theme-toggle");
    if (!toggle) return;

    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");

    if (initial === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    }

    toggle.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const next = isDark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
    });
}

function initBackToTop() {
    const btn = $("#back-to-top");
    if (!btn) return;

    const onScroll = () => {
        btn.classList.toggle("is-visible", window.scrollY > 600);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function initReadingProgress() {
    const bar = $("#reading-progress");
    if (!bar) return;

    const onScroll = () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
        bar.style.width = `${Math.min(progress, 100)}%`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
}

/* ===== Lightbox ===== */

window.openLightbox = function(index) {
    const gallery = window._galleryData;
    if (!gallery || !gallery[index]) return;

    const item = gallery[index];
    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.innerHTML = `
        <img src="${safeUrl(item.image)}" alt="${esc(item.caption || "")}">
        <div class="lightbox-caption">${esc(item.caption || "")}</div>
    `;

    overlay.addEventListener("click", () => {
        overlay.classList.remove("is-active");
        setTimeout(() => overlay.remove(), 300);
    });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-active"));

    const onKey = (e) => {
        if (e.key === "Escape") {
            overlay.classList.remove("is-active");
            setTimeout(() => overlay.remove(), 300);
            document.removeEventListener("keydown", onKey);
        }
    };
    document.addEventListener("keydown", onKey);
};

function initReveal() {
    const sections = $$("main section");
    if (!sections.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const revealNodes = $$(".reveal", entry.target);
            revealNodes.forEach(node => node.classList.add("is-visible"));
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: "0px 0px -14% 0px",
        threshold: 0.16
    });

    sections.forEach(section => {
        const revealNodes = $$(".reveal", section);
        revealNodes.forEach((node, index) => {
            node.style.setProperty("--reveal-delay", `${Math.min(index * 56, 420)}ms`);
        });
        observer.observe(section);
    });
}

/* ===== Utilities ===== */

function setText(id, value) {
    const node = document.getElementById(id);
    if (node && value !== undefined && value !== null) node.textContent = value;
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "#";
    if (/^(https?:|mailto:|\/|\.\/|\.\.\/|#)/i.test(url)) return url;
    if (!url.startsWith("//") && !/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
    return "#";
}

function stripHtml(value) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstSentence(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const match = text.match(/.*?[.!?](?:\s|$)/);
    return (match ? match[0] : text).trim();
}
