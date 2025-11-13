(() => {
  console.log("MessageBar Formatter Loaded");

  // Temporary store for detected modal data
  window._modalQueue = window._modalQueue || [];

  function formatMessageContent(el) {
    if (!el || el.dataset.formatted === "true") return;
    el.dataset.formatted = "true";

    let text = el.innerHTML;
    text = text.replace(/&#xA;/g, '\n');
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    console.log(text)

    // --- Parse and extract modal content ---
    const modalPattern = /##\s*(.*?)\s*##([\s\S]*?)(?=(##|$))/g;
    let match;
    while ((match = modalPattern.exec(text)) !== null) {
      const title = match[1].trim();
      const bodyRaw = match[2]
        .trim()
        .replace(/^#\s*/gm, "")   // remove leading #
        .replace(/^>\s*/gm, "")   // remove leading >
        .trim();
      window._modalQueue.push({ title, body: bodyRaw });
    }

    // --- Continue with normal inline formatting ---
    let html = text
      .replace(/\*h\*(.*?)\*h\*/g, "<h4 style='margin:4px 0;'>$1</h4>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|\n)(-- .*(?:\n-- .*)*)/g, (match, p1, p2) => {
        const items = p2
          .split(/\n/)
          .map(line => line.replace(/^\s*-- /, '').trim())
          .filter(Boolean)
          .map(text => `<li>${text}</li>`)
          .join('');
        return `${p1}<ul style="margin-left:20px;">${items}</ul>`;
      })
      .replace(/(^|\n)(- .*(?:\n- .*)*)/g, (match, p1, p2) => {
        const items = p2
          .split(/\n/)
          .map(line => line.replace(/^\s*- /, '').trim())
          .filter(Boolean)
          .map(text => `<li>${text}</li>`)
          .join('');
        return `${p1}<ul>${items}</ul>`;
      })
      .replace(/\n{2,}/g, "<br><br>")
      .replace(/\n/g, "<br>");

    el.innerHTML = html;
  }

  function processAll() {
    document.querySelectorAll(".MessageBar .Content").forEach(formatMessageContent);
  }

  chrome.storage.sync.get({ format: true }, ({ format }) => {
    if (!format) return;
    processAll();

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
