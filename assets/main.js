(() => {
  'use strict';

  const root = document.documentElement;
  const languageButton = document.querySelector('[data-language-toggle]');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.getElementById('mobile-nav');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let language = 'en';

  const savePreference = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ }
  };

  function updateControls() {
    const chinese = language === 'zh';
    const dark = root.dataset.theme === 'dark';
    languageButton.setAttribute('aria-label', chinese ? 'Switch to English' : '切换到中文');
    themeButton.setAttribute('aria-label', chinese
      ? (dark ? '切换到浅色主题' : '切换到深色主题')
      : (dark ? 'Switch to light theme' : 'Switch to dark theme'));
    themeButton.setAttribute('aria-pressed', String(dark));
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-label', chinese
      ? (expanded ? '关闭导航' : '打开导航')
      : (expanded ? 'Close navigation' : 'Open navigation'));
    themeColor.content = dark ? '#1c1d20' : '#faf9f6';
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === 'zh' ? 'zh' : 'en';
    root.lang = language === 'zh' ? 'zh-CN' : 'en';
    root.dataset.language = language;
    document.querySelectorAll('[data-en][data-zh]').forEach(element => {
      const value = element.dataset[language];
      if (element.tagName === 'META') element.content = value;
      else if (element.dataset.translateAttribute) element.setAttribute(element.dataset.translateAttribute, value);
      else element.textContent = value.replace(/\\n/g, '\n');
    });
    updateControls();
  }

  function closeMenu(returnFocus = false) {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    updateControls();
    if (returnFocus) menuButton.focus();
  }

  try { language = localStorage.getItem('weijian-language') || 'en'; } catch { /* English is the default. */ }
  setLanguage(language);

  languageButton.addEventListener('click', () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
    savePreference('weijian-language', language);
  });

  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    savePreference('weijian-theme', root.dataset.theme);
    updateControls();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    try { if (localStorage.getItem('weijian-theme')) return; } catch { /* Follow system. */ }
    root.dataset.theme = event.matches ? 'dark' : 'light';
    updateControls();
  });

  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    mobileNav.hidden = expanded;
    menuButton.setAttribute('aria-expanded', String(!expanded));
    updateControls();
  });

  mobileNav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  // Track the section nearest the header, including short sections at page end.
  const sections = [...document.querySelectorAll('main > section[id]')];
  const links = [...document.querySelectorAll('.desktop-nav .nav-link')];
  let scrollScheduled = false;
  function updateActiveSection() {
    const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 170) active = section;
    }
    if (nearBottom) active = sections[sections.length - 1];
    for (const link of links) {
      if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    scrollScheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollScheduled) {
      requestAnimationFrame(updateActiveSection);
      scrollScheduled = true;
    }
  }, { passive: true });
  updateActiveSection();
})();
