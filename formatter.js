(() => {
  console.log("MessageBar Formatter Loaded");

  // --- Convert plain text to formatted HTML ---
  function formatMessageContent(el) {
    if (!el || el.dataset.formatted === "true") return;
    el.dataset.formatted = "true";

    let text = el.innerHTML;

    // Decode HTML entities like &#xA; and replace with line breaks
    text = text.replace(/&#xA;/g, '\n');

    // Escape accidental HTML
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Formatting rules
    let html = text
      // Headings
      .replace(/\*h\*(.*?)\*h\*/g, "<h4 style='margin:4px 0;'>$1</h4>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

      // Indented bullet points
      .replace(/(^|\n)(-- .*(?:\n-- .*)*)/g, (match, p1, p2) => {
        const items = p2
          .split(/\n/)
          .map(line => line.replace(/^\s*-- /, '').trim())
          .filter(Boolean)
          .map(text => `<li>${text}</li>`)
          .join('');
        return `${p1}<ul style="margin-left:20px; margin-top:2px; margin-bottom:2px;">${items}</ul>`;
      })

      // Regular bullet points
      .replace(/(^|\n)(- .*(?:\n- .*)*)/g, (match, p1, p2) => {
        const items = p2
          .split(/\n/)
          .map(line => line.replace(/^\s*- /, '').trim())
          .filter(Boolean)
          .map(text => `<li>${text}</li>`)
          .join('');
        return `${p1}<ul style="margin-top:2px; margin-bottom:2px;">${items}</ul>`;
      })

      // Line breaks
      .replace(/\n{2,}/g, "<br><br>")
      .replace(/\n/g, "<br>");

    el.innerHTML = html;
  }

  // --- Process all current and future message bars ---
  function processAll() {
    document.querySelectorAll(".MessageBar .Content").forEach(formatMessageContent);
  }

  // Initialize only if user enabled the formatter
  chrome.storage.sync.get({ format: true }, ({ format }) => {
    if (!format) return; // feature disabled, skip entirely

    processAll();

    // Watch for new alerts being added
    const container = document.querySelector(".MessageBarContainer");
    if (container) {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              node.querySelectorAll?.(".MessageBar .Content").forEach(formatMessageContent);
            }
          });
        }
      });
      observer.observe(container, { childList: true, subtree: true });
    }
  });
})();
