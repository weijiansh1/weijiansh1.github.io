const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const fallbackData = {
    profile: {
        name: 'Weijian Shi',
        name_cn: '石伟建',
        title: 'Fudan University · Aerospace Engineering + Computational Science',
        subtitle: 'Exploring intelligent flight, robotics, and scientific computing.',
        avatar: 'avatar.jpg',
        bio: [
            'Hi! I am <strong>Weijian Shi</strong> (石伟建), an undergraduate student at <strong>Fudan University</strong>.',
            'I am building a foundation across aircraft design, computational science, and intelligent systems.'
        ],
        education: [],
        skills: ['Python', 'C/C++', 'MATLAB', 'LaTeX', 'Git', 'Linux']
    },
    research: [],
    awards: [],
    publications: [],
    blog: [],
    contact: {
        github: 'https://github.com/weijiansh1',
        location: 'Shanghai, China'
    }
};

// ===== Theme Toggle =====
const themeToggle = $('#theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });
}

function updateThemeIcon(theme) {
    const icon = themeToggle?.querySelector('i');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===== Mobile Menu =====
const navToggle = $('.nav-toggle');
const navLinks = $('.nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// ===== Homepage Data =====
const isHomepage = document.body.classList.contains('home-page');

if (isHomepage) {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => render(data))
        .catch(error => {
            console.warn('Failed to load data.json; using fallback content.', error);
            render(fallbackData);
        });

    initPageExperience();
}

function render(data) {
    const profile = data.profile || fallbackData.profile;

    setText('hero-name', profile.name);
    setText('hero-title', profile.title);
    setText('hero-subtitle', profile.subtitle);

    const avatar = $('#hero-avatar-img');
    if (avatar && profile.avatar) avatar.src = profile.avatar;

    renderHeroLinks(data.contact || {});
    renderBio(profile.bio || []);
    renderEducation(profile.education || []);
    renderSkills(profile.skills || []);
    renderHighlights(profile, data.contact || {});
    renderResearch(data.research || []);
    renderFocus(profile.focus || defaultFocus());
    renderFilteredList(data.awards || [], 'awards-filters', 'awards-list', renderAward, {
        icon: 'fa-award',
        title: 'Awards section is ready.',
        text: 'Add honors, competition results, or scholarships when you want to publish them.'
    });
    renderFilteredList(data.publications || [], 'pub-filters', 'pub-list', renderPublication, {
        icon: 'fa-pen-nib',
        title: 'Publications are in progress.',
        text: 'This space is prepared for papers, preprints, reports, and technical notes.'
    });
    renderBlog(data.blog || []);
    renderContact(data.contact || {});
    initAnimations();
}

function setText(id, value) {
    const node = document.getElementById(id);
    if (node && value !== undefined && value !== null) node.textContent = value;
}

function html(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeUrl(value) {
    const url = String(value || '').trim();
    if (!url) return '';
    if (/^(https?:|mailto:|\/|\.\/|\.\.\/|#)/i.test(url)) return url;
    return '#';
}

function solidIcon(icon, fallback = 'fa-link') {
    const value = String(icon || fallback).trim();
    return value.startsWith('fa-') ? `fas ${value}` : `fas fa-${value}`;
}

function renderHeroLinks(contact) {
    const heroLinks = $('#hero-links');
    if (!heroLinks) return;

    const links = contactLinks(contact);
    heroLinks.innerHTML = links.map(link => `
        <a href="${safeUrl(link.href)}" ${link.external ? 'target="_blank" rel="noreferrer"' : ''} aria-label="${html(link.label)}">
            <i class="${html(link.icon)}"></i>
        </a>
    `).join('');
}

function contactLinks(contact) {
    const links = [];
    if (contact.github) links.push({ label: 'GitHub', href: contact.github, icon: 'fab fa-github', external: true });
    if (contact.email) links.push({ label: 'Email', href: `mailto:${contact.email}`, icon: 'fas fa-envelope', external: false });
    if (contact.scholar) links.push({ label: 'Google Scholar', href: contact.scholar, icon: 'fas fa-graduation-cap', external: true });
    if (contact.linkedin) links.push({ label: 'LinkedIn', href: contact.linkedin, icon: 'fab fa-linkedin', external: true });
    if (contact.website) links.push({ label: 'Website', href: contact.website, icon: 'fas fa-globe', external: true });
    return links;
}

function renderBio(bio) {
    const bioElement = $('#about-bio');
    if (!bioElement) return;
    bioElement.innerHTML = bio.length
        ? bio.map(paragraph => `<p>${paragraph}</p>`).join('')
        : '<p>Profile details will be added soon.</p>';
}

function renderEducation(education) {
    const educationElement = $('#about-education');
    if (!educationElement) return;

    educationElement.innerHTML = education.length ? education.map(item => `
        <div class="timeline-item">
            ${item.date ? `<span class="timeline-date">${html(item.date)}</span>` : ''}
            <h4>${html(item.school || 'Education')}</h4>
            ${item.degree ? `<p>${html(item.degree).replace(/\n/g, '<br>')}</p>` : ''}
            ${item.detail ? `<p>${html(item.detail).replace(/\n/g, '<br>')}</p>` : ''}
        </div>
    `).join('') : `
        <div class="timeline-item">
            <span class="timeline-date">Now</span>
            <h4>Learning in progress</h4>
            <p>Education details will be updated here.</p>
        </div>
    `;
}

function renderSkills(skills) {
    const skillsElement = $('#about-skills');
    if (!skillsElement) return;
    skillsElement.innerHTML = skills.map(skill => `<span class="skill-tag">${html(skill)}</span>`).join('');
}

function renderHighlights(profile, contact) {
    const highlightElement = $('#profile-highlights');
    if (!highlightElement) return;

    const highlights = profile.highlights || [
        { label: 'University', value: 'Fudan University' },
        { label: 'Track', value: 'Aerospace + Computing' },
        { label: 'Base', value: contact.location ? contact.location.split('\n')[0] : 'Shanghai, China' },
        { label: 'Mode', value: 'Curious builder' }
    ];

    highlightElement.innerHTML = highlights.map(item => `
        <article class="highlight-card fade-in">
            <span>${html(item.label)}</span>
            <strong>${html(item.value)}</strong>
        </article>
    `).join('');
}

function renderResearch(researchItems) {
    const researchElement = $('#research-grid');
    if (!researchElement) return;

    const items = researchItems.length ? researchItems : [
        { icon: 'fa-plane', title: 'Aerospace Engineering', desc: 'Flight mechanics, aircraft design, and systems thinking.' },
        { icon: 'fa-robot', title: 'Artificial Intelligence', desc: 'Learning models and methods for intelligent engineering systems.' },
        { icon: 'fa-calculator', title: 'Computational Science', desc: 'Numerical methods, optimization, and scientific programming.' }
    ];

    researchElement.innerHTML = items.map(item => `
        <article class="research-card">
            <div class="research-icon"><i class="${html(solidIcon(item.icon, 'fa-flask'))}"></i></div>
            <h3>${html(item.title)}</h3>
            <p>${html(item.desc)}</p>
        </article>
    `).join('');
}

function defaultFocus() {
    return [
        { label: 'Near Term', text: 'Strengthen math, programming, and engineering fundamentals.' },
        { label: 'Build Habit', text: 'Document experiments, notes, and project iterations publicly.' },
        { label: 'Long View', text: 'Explore reliable intelligent systems for aerospace applications.' }
    ];
}

function renderFocus(focusItems) {
    const focusElement = $('#focus-list');
    if (!focusElement) return;
    focusElement.innerHTML = focusItems.map(item => `
        <article class="focus-item fade-in">
            <strong>${html(item.label)}</strong>
            <span>${html(item.text)}</span>
        </article>
    `).join('');
}

function renderAward(item) {
    return `
        <article class="pub-item" data-category="${html(item.category || 'Other')}">
            <div class="pub-year">${html(item.year || 'Now')}</div>
            <div class="pub-content">
                <h3>${html(item.title)}</h3>
                ${item.detail ? `<p class="pub-authors">${html(item.detail)}</p>` : ''}
                ${item.category ? `<span class="category-badge">${html(item.category)}</span>` : ''}
            </div>
        </article>
    `;
}

function renderPublication(item) {
    const links = Array.isArray(item.links) ? item.links : [];
    const linksHtml = links.length ? `
        <div class="pub-links">
            ${links.map(link => `
                <a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">
                    <i class="${html(solidIcon(link.icon, 'fa-link'))}"></i> ${html(link.label || 'Link')}
                </a>
            `).join('')}
        </div>
    ` : '';

    return `
        <article class="pub-item" data-category="${html(item.category || 'Other')}">
            <div class="pub-year">${html(item.year || 'Draft')}</div>
            <div class="pub-content">
                <h3>${html(item.title)}</h3>
                ${item.authors ? `<p class="pub-authors">${html(item.authors)}</p>` : ''}
                ${item.venue ? `<p class="pub-venue">${html(item.venue)}</p>` : ''}
                ${item.category ? `<span class="category-badge">${html(item.category)}</span>` : ''}
                ${linksHtml}
            </div>
        </article>
    `;
}

function renderFilteredList(items, filterId, listId, renderItem, emptyState) {
    const filterElement = document.getElementById(filterId);
    const listElement = document.getElementById(listId);
    if (!filterElement || !listElement) return;

    filterElement.innerHTML = '';

    if (!items.length) {
        listElement.innerHTML = `
            <div class="empty-state fade-in">
                <i class="fas ${html(emptyState.icon)}"></i>
                <div>
                    <strong>${html(emptyState.title)}</strong>
                    <span>${html(emptyState.text)}</span>
                </div>
            </div>
        `;
        return;
    }

    const categories = [...new Set(items.map(item => item.category || 'Other'))];
    if (categories.length > 1) {
        filterElement.innerHTML = `<button class="filter-btn active" data-filter="all">All</button>` +
            categories.map(category => `<button class="filter-btn" data-filter="${html(category)}">${html(category)}</button>`).join('');

        filterElement.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                filterElement.querySelectorAll('.filter-btn').forEach(item => item.classList.remove('active'));
                button.classList.add('active');

                const filter = button.dataset.filter;
                listElement.querySelectorAll('.pub-item').forEach(item => {
                    item.hidden = filter !== 'all' && item.dataset.category !== filter;
                });
            });
        });
    }

    listElement.innerHTML = items.map(renderItem).join('');
}

function renderBlog(posts) {
    const blogElement = $('#blog-grid');
    if (!blogElement) return;

    if (!posts.length) {
        blogElement.innerHTML = `
            <div class="empty-state fade-in">
                <i class="fas fa-book-open"></i>
                <div>
                    <strong>Blog is ready.</strong>
                    <span>Learning notes and project logs will appear here.</span>
                </div>
            </div>
        `;
        return;
    }

    blogElement.innerHTML = posts.map(post => `
        <article class="blog-card">
            <div class="blog-date">${html(post.date)}</div>
            <h3><a href="${safeUrl(post.url)}">${html(post.title)}</a></h3>
            <p>${html(post.desc)}</p>
            <div class="blog-tags">
                ${(post.tags || []).map(tag => `<span>${html(tag)}</span>`).join('')}
            </div>
        </article>
    `).join('');
}

function renderContact(contact) {
    const contactElement = $('#contact-grid');
    if (!contactElement) return;

    const cards = [];
    if (contact.email) {
        cards.push({
            icon: 'fas fa-envelope',
            label: 'Email',
            body: `<a href="mailto:${html(contact.email)}">${html(contact.email)}</a>`
        });
    }
    if (contact.github) {
        cards.push({
            icon: 'fab fa-github',
            label: 'GitHub',
            body: `<a href="${safeUrl(contact.github)}" target="_blank" rel="noreferrer">${html(contact.github.replace(/^https?:\/\//, ''))}</a>`
        });
    }
    if (contact.scholar) {
        cards.push({
            icon: 'fas fa-graduation-cap',
            label: 'Scholar',
            body: `<a href="${safeUrl(contact.scholar)}" target="_blank" rel="noreferrer">Google Scholar</a>`
        });
    }
    if (contact.location) {
        cards.push({
            icon: 'fas fa-location-dot',
            label: 'Location',
            body: `<p>${html(contact.location).replace(/\n/g, '<br>')}</p>`
        });
    }

    contactElement.innerHTML = cards.length ? cards.map(card => `
        <article class="contact-card">
            <i class="${html(card.icon)}"></i>
            <h3>${html(card.label)}</h3>
            ${card.body}
        </article>
    `).join('') : `
        <div class="empty-state fade-in">
            <i class="fas fa-paper-plane"></i>
            <div>
                <strong>Contact details coming soon.</strong>
                <span>Add email, GitHub, or location in data.json.</span>
            </div>
        </div>
    `;
}

// ===== Page Turning =====
function initPageExperience() {
    const pages = $$('.home-page .page[id]');
    if (!pages.length) return;

    const pageIndicator = $('#page-indicator');
    const prevButton = $('#prev-page');
    const nextButton = $('#next-page');
    const railButtons = $$('.rail-dot[data-target]');
    const navAnchors = $$('.nav-links a[href^="#"], .page-link[href^="#"]');
    let currentPage = 0;
    let isPaging = false;
    let wheelDelta = 0;
    let touchStartY = 0;
    let touchStartX = 0;

    function setActivePage(index) {
        currentPage = Math.max(0, Math.min(index, pages.length - 1));
        const activeId = pages[currentPage].id;
        const pageNumber = String(currentPage + 1).padStart(2, '0');
        const total = String(pages.length).padStart(2, '0');

        if (pageIndicator) pageIndicator.textContent = `${pageNumber} / ${total}`;
        if (prevButton) prevButton.disabled = currentPage === 0;
        if (nextButton) nextButton.disabled = currentPage === pages.length - 1;

        $$('.nav-links a[href^="#"]').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
        });

        railButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.target === activeId);
        });
    }

    function playPageTurn(direction, targetPage, sourcePage) {
        if (prefersReducedMotion.matches) return;
        if (sourcePage) {
            sourcePage.classList.remove('page-exit-next', 'page-exit-prev');
            void sourcePage.offsetWidth;
            sourcePage.classList.add(direction === 'prev' ? 'page-exit-prev' : 'page-exit-next');
            window.setTimeout(() => sourcePage.classList.remove('page-exit-next', 'page-exit-prev'), 820);
        }

        if (targetPage) {
            targetPage.classList.remove('page-arrive-next', 'page-arrive-prev');
            void targetPage.offsetWidth;
            targetPage.classList.add(direction === 'prev' ? 'page-arrive-prev' : 'page-arrive-next');
            window.setTimeout(() => targetPage.classList.remove('page-arrive-next', 'page-arrive-prev'), 820);
        }
    }

    function easedProgress(progress) {
        const clamped = Math.min(Math.max(progress, 0), 1);
        if (clamped < 0.72) {
            return 1.03 * (1 - Math.pow(1 - clamped / 0.72, 3));
        }
        const settle = (clamped - 0.72) / 0.28;
        return 1.03 - 0.03 * (1 - Math.pow(1 - settle, 3));
    }

    function scrollToPage(page, done) {
        const navHeight = $('#navbar')?.offsetHeight || 0;
        const startY = window.scrollY;
        const targetY = Math.max(0, page.offsetTop - navHeight + 1);
        const distance = targetY - startY;
        if (prefersReducedMotion.matches || Math.abs(distance) < 2) {
            window.scrollTo(0, targetY);
            done?.();
            return;
        }

        const duration = Math.min(920, Math.max(620, Math.abs(distance) * 0.45));
        const startTime = performance.now();

        function step(now) {
            const progress = (now - startTime) / duration;
            const nextY = startY + distance * easedProgress(progress);
            window.scrollTo(0, nextY);

            if (progress < 1) {
                requestAnimationFrame(step);
                return;
            }

            window.scrollTo(0, targetY);
            done?.();
        }

        requestAnimationFrame(step);
    }

    function goToPage(index, direction) {
        const targetIndex = Math.max(0, Math.min(index, pages.length - 1));
        if (targetIndex === currentPage || isPaging) return;

        const resolvedDirection = direction || (targetIndex > currentPage ? 'next' : 'prev');
        const sourcePage = pages[currentPage];
        isPaging = true;
        document.body.classList.add('is-section-turning');
        playPageTurn(resolvedDirection, pages[targetIndex], sourcePage);
        setActivePage(targetIndex);
        scrollToPage(pages[targetIndex], () => {
            isPaging = false;
            wheelDelta = 0;
            document.body.classList.remove('is-section-turning');
        });
    }

    const observer = new IntersectionObserver(entries => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible && !isPaging) setActivePage(pages.indexOf(visible.target));
    }, {
        threshold: [0.35, 0.55, 0.75]
    });

    pages.forEach(page => observer.observe(page));

    navAnchors.forEach(anchor => {
        anchor.addEventListener('click', event => {
            const id = anchor.getAttribute('href')?.slice(1);
            const index = pages.findIndex(page => page.id === id);
            if (index === -1) return;
            event.preventDefault();
            goToPage(index);
        });
    });

    railButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = pages.findIndex(page => page.id === button.dataset.target);
            if (index !== -1) goToPage(index);
        });
    });

    prevButton?.addEventListener('click', () => goToPage(currentPage - 1, 'prev'));
    nextButton?.addEventListener('click', () => goToPage(currentPage + 1, 'next'));

    window.addEventListener('wheel', event => {
        if (window.innerWidth < 860 || prefersReducedMotion.matches) return;
        event.preventDefault();
        if (isPaging) {
            return;
        }

        wheelDelta += event.deltaY;
        if (Math.abs(wheelDelta) < 150) return;

        const direction = wheelDelta > 0 ? 'next' : 'prev';
        const targetIndex = currentPage + (direction === 'next' ? 1 : -1);
        if (targetIndex < 0 || targetIndex >= pages.length) {
            wheelDelta = 0;
            return;
        }

        goToPage(targetIndex, direction);
    }, { passive: false });

    window.addEventListener('touchstart', event => {
        const touch = event.touches[0];
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;
    }, { passive: true });

    window.addEventListener('touchend', event => {
        if (isPaging || prefersReducedMotion.matches) return;
        const touch = event.changedTouches[0];
        const deltaY = touchStartY - touch.clientY;
        const deltaX = touchStartX - touch.clientX;
        if (Math.abs(deltaY) < 88 || Math.abs(deltaX) > 70) return;

        const direction = deltaY > 0 ? 'next' : 'prev';
        goToPage(currentPage + (direction === 'next' ? 1 : -1), direction);
    }, { passive: true });

    setActivePage(0);
}

function initAnimations() {
    const fadeElements = $$(
        '.section-heading, .story-card, .mini-card, .research-card, .pub-item, .blog-card, .contact-card, .highlight-card, .focus-item, .empty-state'
    );

    if (!fadeElements.length) return;

    fadeElements.forEach(element => element.classList.add('fade-in'));

    if (prefersReducedMotion.matches) {
        fadeElements.forEach(element => element.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    fadeElements.forEach(element => observer.observe(element));
}
