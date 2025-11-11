(() => {
  function applyRename() {
    const original = document.title || "";
    let newTitle = null;

    // Common patterns like: "Ticket T12345 - Subject", "Task T12345 — Subject"
    const patterns = [
      /^(?:Ticket|Task)\s+(?:T\d+|#?\d+)\s*[-–—]\s*(.+)$/i,
      // Fallback: prefix contains "Ticket" or "Task", strip up to first " - "
      /^(?:.*?(?:Ticket|Task).*?)\s-\s(.+)$/
    ];

    for (const re of patterns) {
      const m = original.match(re);
      if (m && m[1]) {
        newTitle = m[1].trim();
        break;
      }
    }

    if (newTitle && newTitle !== original) {
      // Keep it short-ish
      document.title = newTitle.slice(0, 70);
    }
  }

  // Only run if rename is enabled
  chrome.storage.sync.get({ rename: true }, ({ rename }) => {
    if (rename) applyRename();
  });

  // If the user toggles "rename" ON while the page is open, apply immediately
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.rename && changes.rename.newValue) {
      applyRename();
    }
  });
})();
