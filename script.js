// ===== Theme Toggle =====
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
});

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===== Mobile Menu =====
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
});

// ===== Scroll Highlight =====
const sections = document.querySelectorAll('section[id]');
function highlightNav() {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (link) {
            link.classList.toggle('active', scrollY >= top && scrollY < top + height);
        }
    });
}
window.addEventListener('scroll', highlightNav);

// ===== Load Data & Render =====
fetch('data.json')
    .then(r => r.json())
    .then(data => render(data))
    .catch(err => console.error('Failed to load data.json:', err));

function render(data) {
    const p = data.profile;

    // Hero
    document.getElementById('hero-name').textContent = p.name;
    document.getElementById('hero-title').textContent = p.title;
    document.getElementById('hero-subtitle').textContent = p.subtitle;
    if (p.avatar) {
        document.getElementById('hero-avatar-img').src = p.avatar;
    }

    // Hero links
    const heroLinks = document.getElementById('hero-links');
    let linksHtml = '';
    if (data.contact.github) {
        linksHtml += `<a href="${data.contact.github}" target="_blank"><i class="fab fa-github"></i></a>`;
    }
    if (data.contact.email) {
        linksHtml += `<a href="mailto:${data.contact.email}"><i class="fas fa-envelope"></i></a>`;
    }
    if (data.contact.scholar) {
        linksHtml += `<a href="${data.contact.scholar}" target="_blank"><i class="fas fa-graduation-cap"></i></a>`;
    }
    if (data.contact.linkedin) {
        linksHtml += `<a href="${data.contact.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>`;
    }
    heroLinks.innerHTML = linksHtml;

    // Bio
    const bioEl = document.getElementById('about-bio');
    bioEl.innerHTML = p.bio.map(b => `<p>${b}</p>`).join('');

    // Education
    const eduEl = document.getElementById('about-education');
    eduEl.innerHTML = p.education.map(e => `
        <div class="timeline-item">
            <span class="timeline-date">${e.date}</span>
            <h4>${e.school}</h4>
            <p>${e.degree.replace(/\n/g, '<br>')}</p>
            ${e.detail ? `<p style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px">${e.detail.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
    `).join('');

    // Skills
    const skillsEl = document.getElementById('about-skills');
    skillsEl.innerHTML = p.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');

    // Research
    const researchEl = document.getElementById('research-grid');
    researchEl.innerHTML = data.research.map(r => `
        <div class="research-card">
            <div class="research-icon"><i class="fas ${r.icon}"></i></div>
            <h3>${r.title}</h3>
            <p>${r.desc}</p>
        </div>
    `).join('');

    // Awards with category filter
    renderFilteredList('awards', data.awards, 'awards-filters', 'awards-list', item => `
        <div class="pub-item" data-category="${item.category || 'Other'}">
            ${item.year ? `<div class="pub-year">${item.year}</div>` : ''}
            <div class="pub-content">
                <h3>${item.title}</h3>
                ${item.detail ? `<p class="pub-authors">${item.detail}</p>` : ''}
                ${item.category ? `<span class="category-badge">${item.category}</span>` : ''}
            </div>
        </div>
    `);

    // Publications with category filter
    renderFilteredList('publications', data.publications, 'pub-filters', 'pub-list', item => {
        let linksHtml = '';
        if (item.links && item.links.length) {
            linksHtml = `<div class="pub-links">${item.links.map(l =>
                `<a href="${l.url}"><i class="fas fa-${l.icon || 'link'}"></i> ${l.label}</a>`
            ).join('')}</div>`;
        }
        return `
            <div class="pub-item" data-category="${item.category || 'Other'}">
                ${item.year ? `<div class="pub-year">${item.year}</div>` : ''}
                <div class="pub-content">
                    <h3>${item.title}</h3>
                    ${item.authors ? `<p class="pub-authors">${item.authors}</p>` : ''}
                    ${item.venue ? `<p class="pub-venue">${item.venue}</p>` : ''}
                    ${item.category ? `<span class="category-badge">${item.category}</span>` : ''}
                    ${linksHtml}
                </div>
            </div>
        `;
    });

    // Blog
    const blogEl = document.getElementById('blog-grid');
    blogEl.innerHTML = data.blog.map(b => `
        <article class="blog-card">
            <div class="blog-date">${b.date}</div>
            <h3><a href="${b.url}">${b.title}</a></h3>
            <p>${b.desc}</p>
            <div class="blog-tags">
                ${b.tags.map(t => `<span>${t}</span>`).join('')}
            </div>
        </article>
    `).join('');

    // Contact
    const contactEl = document.getElementById('contact-grid');
    let contactHtml = '';
    if (data.contact.email) {
        contactHtml += `<div class="contact-card"><i class="fas fa-envelope"></i><h3>Email</h3><a href="mailto:${data.contact.email}">${data.contact.email}</a></div>`;
    }
    if (data.contact.github) {
        contactHtml += `<div class="contact-card"><i class="fab fa-github"></i><h3>GitHub</h3><a href="${data.contact.github}" target="_blank">${data.contact.github.replace('https://','')}</a></div>`;
    }
    if (data.contact.location) {
        contactHtml += `<div class="contact-card"><i class="fas fa-map-marker-alt"></i><h3>Location</h3><p>${data.contact.location.replace(/\n/g,'<br>')}</p></div>`;
    }
    contactEl.innerHTML = contactHtml;

    // Scroll animations
    initAnimations();
}

function renderFilteredList(sectionId, items, filterId, listId, renderItem) {
    const filterEl = document.getElementById(filterId);
    const listEl = document.getElementById(listId);

    // Get unique categories
    const categories = [...new Set(items.map(i => i.category || 'Other'))];

    // Render filter tabs if more than one category
    if (categories.length > 1) {
        filterEl.innerHTML = `<button class="filter-btn active" data-filter="all">All</button>` +
            categories.map(c => `<button class="filter-btn" data-filter="${c}">${c}</button>`).join('');

        filterEl.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                listEl.querySelectorAll('.pub-item').forEach(item => {
                    item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
                });
            });
        });
    }

    // Render items
    listEl.innerHTML = items.map(renderItem).join('');
}

function initAnimations() {
    const fadeElements = document.querySelectorAll(
        '.research-card, .pub-item, .blog-card, .contact-card, .about-grid, .skills'
    );
    fadeElements.forEach(el => el.classList.add('fade-in'));
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    fadeElements.forEach(el => observer.observe(el));
}
