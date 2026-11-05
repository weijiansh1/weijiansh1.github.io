// Keep former homepage and preview links working, including queries and anchors.
(() => {
  const target = document.currentScript.dataset.target || 'index.html';
  window.location.replace(target + window.location.search + window.location.hash);
})();
