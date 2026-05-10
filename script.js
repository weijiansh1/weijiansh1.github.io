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
            initFluidCanvas();
            initScrollIndicator();
            initHeroParallax();
            initTypewriter();
        })
        .catch(error => {
            console.warn("Failed to load data.json; using fallback content.", error);
            render(fallbackData);
            initChrome(fallbackData);
            initReveal();
            initFluidCanvas();
            initScrollIndicator();
            initHeroParallax();
            initTypewriter();
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
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const initial = saved || (prefersLight ? "light" : "dark");

    if (initial === "light") {
        document.documentElement.setAttribute("data-theme", "light");
    }

    toggle.addEventListener("click", () => {
        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        const next = isLight ? "dark" : "light";
        if (next === "dark") {
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute("data-theme", "light");
        }
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

/* ===== WebGL Fluid Simulation ===== */

function initFluidCanvas() {
    const canvas = document.getElementById("fluid-canvas");
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    let w, h, dpr;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.floor(w * dpr * 0.5);
        canvas.height = Math.floor(h * dpr * 0.5);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize);

    const vertSrc = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;
    const fragSrc = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_res;
        uniform vec2 u_mouse;
        uniform float u_mouseStrength;

        vec3 palette(float t) {
            vec3 a = vec3(0.388, 0.278, 0.478);
            vec3 b = vec3(0.388, 0.348, 0.428);
            vec3 c = vec3(1.0, 1.0, 1.0);
            vec3 d = vec3(0.0, 0.107, 0.337);
            return a + b * cos(6.28318 * (c * t + d));
        }

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
            for (int i = 0; i < 5; i++) {
                v += a * noise(p);
                p = rot * p * 2.0;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_res;
            vec2 p = uv * 3.0;
            float t = u_time * 0.15;

            float f1 = fbm(p + vec2(t * 0.7, t * 0.4));
            float f2 = fbm(p + vec2(f1 * 1.2 + t * 0.3, f1 * 0.8 - t * 0.2));
            float f3 = fbm(p + vec2(f2 * 1.4 - t * 0.1, f2 * 1.1 + t * 0.5));

            float pattern = f1 * 0.3 + f2 * 0.4 + f3 * 0.3;

            // Mouse interaction
            vec2 mUV = u_mouse;
            float dist = length(uv - mUV);
            float mouseEffect = smoothstep(0.35, 0.0, dist) * u_mouseStrength;
            pattern += mouseEffect * 0.4;
            float colorShift = mouseEffect * 0.5;

            vec3 col = palette(pattern * 0.8 + colorShift + 0.1);
            col *= 0.35 + pattern * 0.3;

            // Vignette
            float vig = 1.0 - dot((uv - 0.5) * 1.2, (uv - 0.5) * 1.2);
            col *= vig;

            gl_FragColor = vec4(col, 0.85);
        }
    `;

    function compileShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn("Shader compile error:", gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vertSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uMouseStrength = gl.getUniformLocation(prog, "u_mouseStrength");

    let mouseX = 0.5, mouseY = 0.5, mouseStrength = 0;
    let targetMX = 0.5, targetMY = 0.5, targetStrength = 0;

    const heroSection = document.getElementById("home");

    function onPointerMove(e) {
        const rect = canvas.getBoundingClientRect();
        targetMX = (e.clientX - rect.left) / rect.width;
        targetMY = 1.0 - (e.clientY - rect.top) / rect.height;
        targetStrength = 1.0;
    }

    function onPointerLeave() {
        targetStrength = 0;
    }

    heroSection?.addEventListener("pointermove", onPointerMove);
    heroSection?.addEventListener("pointerleave", onPointerLeave);

    // Touch support
    heroSection?.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            onPointerMove(e.touches[0]);
        }
    }, { passive: true });

    const start = performance.now();
    let animId;

    function frame() {
        const elapsed = (performance.now() - start) / 1000;

        mouseX += (targetMX - mouseX) * 0.08;
        mouseY += (targetMY - mouseY) * 0.08;
        mouseStrength += (targetStrength - mouseStrength) * 0.05;
        targetStrength *= 0.98;

        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mouseX, mouseY);
        gl.uniform1f(uMouseStrength, mouseStrength);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animId = requestAnimationFrame(frame);
    }

    frame();

    // Pause when not visible
    const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            if (!animId) frame();
        } else {
            cancelAnimationFrame(animId);
            animId = null;
        }
    }, { threshold: 0.05 });

    obs.observe(heroSection || canvas);
}

/* ===== Scroll Indicator ===== */

function initScrollIndicator() {
    const indicator = $("#scroll-indicator");
    if (!indicator) return;

    indicator.addEventListener("click", () => {
        const about = document.getElementById("about");
        if (about) about.scrollIntoView({ behavior: "smooth" });
    });

    const onScroll = () => {
        indicator.classList.toggle("is-hidden", window.scrollY > 100);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
}

/* ===== Hero Parallax ===== */

function initHeroParallax() {
    const canvas = document.getElementById("fluid-canvas");
    const heroInner = $(".hero-inner");
    if (!canvas) return;

    const onScroll = () => {
        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        const progress = Math.min(scrollY / vh, 1);

        canvas.style.opacity = 1 - progress * 0.9;

        if (heroInner) {
            heroInner.style.transform = `translateY(${scrollY * 0.3}px)`;
            heroInner.style.opacity = 1 - progress * 1.2;
        }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
}

/* ===== Typewriter Effect ===== */

function initTypewriter() {
    const el = document.getElementById("hero-summary");
    if (!el) return;

    const text = el.textContent;
    el.innerHTML = '<span class="typewriter-cursor"></span>';

    let i = 0;
    const cursor = el.querySelector(".typewriter-cursor");

    function type() {
        if (i < text.length) {
            el.insertBefore(document.createTextNode(text[i]), cursor);
            i++;
            setTimeout(type, 40 + Math.random() * 30);
        } else {
            setTimeout(() => { if (cursor) cursor.remove(); }, 2000);
        }
    }

    setTimeout(type, 600);
}
