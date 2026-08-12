// Utility functions used by both browser and node tests
(function(root){
  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      const day = d.getDate();
      const month = d.toLocaleString('en', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(str=''){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  const utils = { formatDate, escapeHtml };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
  }
  if (root) root.utils = utils;
})(typeof window !== 'undefined' ? window : global);
