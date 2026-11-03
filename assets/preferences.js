// Apply saved preferences before painting. The page also works without JavaScript.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  try {
    const theme = localStorage.getItem('weijian-theme');
    root.dataset.theme = theme === 'dark' || theme === 'light'
      ? theme
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch {
    root.dataset.theme = 'light';
  }
})();
