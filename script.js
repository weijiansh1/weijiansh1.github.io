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
    contact: {
        github: "https://github.com/weijiansh1",
        location: "Shanghai, China"
    }
};

if (document.body.classList.contains("home-page")) {
    fetch("data.json?v=20260503f")
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
    renderNotes(data.blog || []);
    renderContact(contact, profile);
}

function renderHero(profile, contact) {
    const school = profile.education?.[0]?.school || "Fudan University";
    const subtitle = stripHtml(profile.subtitle || "aerospace, computation, and AI");
    const title = stripHtml(profile.title || "Undergraduate");
    const summary = `${title} at ${school}, working across ${subtitle}. This site collects selected projects, honors, and ongoing notes.`;
    const place = (contact.location || "Shanghai, China").split("\n")[0];

    setText("hero-summary", summary);
    setText("hero-status", `${place} · ${title}`);

    const heroFacts = $("#hero-facts");
    const heroLinks = $("#hero-links");
    const factItems = Array.isArray(profile.highlights) && profile.highlights.length
        ? profile.highlights
        : [
            { label: "University", value: school },
            { label: "Track", value: subtitle },
            { label: "Base", value: place },
            { label: "Status", value: title }
        ];

    if (heroFacts) {
        heroFacts.innerHTML = factItems.map(item => `
            <div class="hero-fact">
                <span>${html(item.label || "")}</span>
                <strong>${html(item.value || "")}</strong>
            </div>
        `).join("");
    }

    if (heroLinks) {
        const linkItems = [];
        if (contact.github) {
            linkItems.push({
                label: "GitHub",
                value: contact.github.replace(/^https?:\/\//, ""),
                url: contact.github
            });
        }
        if (contact.email) {
            linkItems.push({
                label: "Email",
                value: contact.email,
                url: `mailto:${contact.email}`
            });
        } else {
            linkItems.push({
                label: "Selected Work",
                value: "See projects",
                url: "#work"
            });
        }
        linkItems.push({
            label: "Contact",
            value: "Reach out",
            url: "#contact"
        });

        heroLinks.innerHTML = linkItems.map(item => `
            <a class="hero-link" href="${safeUrl(item.url)}" ${safeUrl(item.url).startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>
                <span>${html(item.label)}</span>
                <strong>${html(item.value)}</strong>
            </a>
        `).join("");
    }

    const heroImage = "assets/hero-aerospace.jpg";
    const heroMedia = $("#hero-media");
    if (heroMedia) {
        heroMedia.style.backgroundImage = `
            url('${safeUrl(heroImage)}')
        `;
        heroMedia.style.backgroundPosition = `70% 38%`;
    }
}

function renderWorkList(targetId, items, emptyText) {
    const workList = document.getElementById(targetId);
    if (!workList) return;

    if (!items.length) {
        workList.innerHTML = `<div class="empty-copy reveal">${html(emptyText || "Selected entries will appear here.")}</div>`;
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
            ? `<div class="experience-thumb" style="background-image:url('${safeUrl(item.image)}'); background-position:${html(item.imagePosition || "center")}"></div>`
            : `
                <div class="experience-fallback">
                    <span class="experience-fallback-kicker">${html(visualKicker)}</span>
                    <strong>${html(visualTitle)}</strong>
                    <p>${html(visualMeta)}</p>
                    ${visualLines.length ? `
                        <div class="experience-fallback-lines">
                            ${visualLines.map(line => `<span>${html(line)}</span>`).join("")}
                        </div>
                    ` : ""}
                </div>
            `;

        return `
            <article class="experience-item reveal">
                <div class="experience-meta">
                    <span>${html(item.year || "Now")}</span>
                    <span>${html(item.category || "Highlight")}</span>
                </div>
                <div class="experience-main">
                    <h3>${html(item.title || "Selected highlight")}</h3>
                    ${item.detail ? `<p>${html(item.detail)}</p>` : ""}
                    ${facts.length ? `
                        <div class="experience-facts">
                            ${facts.map(fact => `
                                <div class="experience-fact">
                                    <span>${html(fact.label || "")}</span>
                                    <strong>${html(fact.value || "")}</strong>
                                </div>
                            `).join("")}
                        </div>
                    ` : ""}
                    ${links.length ? `
                        <div class="experience-links">
                            ${links.map(link => `
                                <a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">${html(link.label || "Link")} ↗</a>
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
            <p class="subsection-label">Direction</p>
            ${focusItems.map(item => `
                <div class="focus-item">
                    <strong>${html(item.label || "")}</strong>
                    <span>${html(item.text || "")}</span>
                </div>
            `).join("")}
        `;
    }

    if (researchGrid) {
        const items = research.length ? research : fallbackData.research;
        researchGrid.innerHTML = items.map((item, index) => `
            <article class="research-entry">
                <div class="research-entry-index">${String(index + 1).padStart(2, "0")}</div>
                <div class="research-entry-main">
                    <h3>${html(item.title || "Research")}</h3>
                    <p>${html(item.desc || "")}</p>
                </div>
            </article>
        `).join("");
    }

    if (skillsCloud) {
        const skills = profile.skills || [];
        skillsCloud.innerHTML = `
            <p class="subsection-label">Tools</p>
            <div class="skills-list">
                ${skills.map(skill => `
                    <span class="skill-pill">${html(skill)}</span>
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
                <span>${html(item.label)}</span>
                <strong>${html(item.value)}</strong>
            </div>
        `).join("");
    }

    if (education) {
        const items = profile.education || [];
        education.innerHTML = items.length ? items.map(item => `
            <div class="timeline-item">
                <div class="timeline-date">${html(item.date || "Now")}</div>
                <div class="timeline-main">
                    <h4>${html(item.school || "")}</h4>
                    ${item.degree ? `<p>${html(item.degree).replace(/\n/g, "<br>")}</p>` : ""}
                </div>
                <div class="timeline-side">${html(item.detail || "").replace(/\n/g, "<br>")}</div>
            </div>
        `).join("") : `<div class="empty-copy">Education details will appear here.</div>`;
    }
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
            <div class="note-row-date">${html(post.date || "Draft")}</div>
            <div class="note-row-main">
                <h3>${html(post.title || "Untitled note")}</h3>
                <p>${html(post.desc || "")}</p>
            </div>
            <div class="note-row-tags">
                ${(post.tags || []).map(tag => `<span>${html(tag)}</span>`).join("")}
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
        primary.innerHTML = `${html(primaryText)} <span>→</span>`;
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
            <div class="label">${html(item.label)}</div>
            ${item.href
                ? `<a class="value" href="${safeUrl(item.href)}" ${safeUrl(item.href).startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>${html(item.value)}</a>`
                : `<div class="value">${html(item.value)}</div>`
            }
        </div>
    `).join("");
}

function initChrome(data) {
    initNav();
    initActiveLinks();
    initHeroParallax();
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

function initHeroParallax() {
    const hero = $("#hero-media");
    if (!hero) return;

    const onScroll = () => {
        const offset = Math.min(window.scrollY, 800);
        const translate = offset * 0.18;
        const scale = 1.02 + offset * 0.00012;
        hero.style.transform = `translateY(${translate}px) scale(${scale})`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
}

function initReveal() {
    const revealNodes = $$(".reveal");
    if (!revealNodes.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.08
    });

    revealNodes.forEach(node => observer.observe(node));
}

function setText(id, value) {
    const node = document.getElementById(id);
    if (node && value !== undefined && value !== null) node.textContent = value;
}

function html(value) {
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
