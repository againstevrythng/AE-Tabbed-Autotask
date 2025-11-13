(() => {
  console.log("MessageBar Formatter Loaded");
  window._modalQueue = window._modalQueue || [];

  function formatMessageContent(el) {
    if (!el || el.dataset.formatted === "true") return;
    el.dataset.formatted = "true";

    // --- STEP 1: Extract full text (handles <span> structure) ---
    let text = "";
    const spans = el.querySelectorAll("span");
    if (spans.length > 0) {
      spans.forEach(span => {
        if (span.classList.contains("ShowMoreLessButton")) return;
        if (span.classList.contains("Ellipses")) return;
        text += (span.textContent || "").trim() + "\n";
      });
    } else {
      text = el.textContent || el.innerText || "";
    }

    // --- STEP 2: Normalize and decode ---
    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/&#xA;/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // --- STEP 3: Extract modal data ---
    const modalPattern = /##\s*(.*?)\s*##([\s\S]*?(?=(?:\n##|$)))/g;
    let match, queued = false;

    while ((match = modalPattern.exec(text)) !== null) {
      const title = match[1].trim();
      const block = match[2].trim();
      const lines = block.split(/\n/);

      let currentModal = null;
      let modals = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith(">>")) {
          // continuation of current modal
          if (currentModal) {
            currentModal.body.push(trimmed.replace(/^>>+\s*/, ""));
          }
        } else if (trimmed.startsWith(">")) {
          // new modal
          if (currentModal) modals.push(currentModal);
          currentModal = { title, body: [trimmed.replace(/^>+\s*/, "")] };
        } else if (currentModal) {
          // stop collecting modal content on non-">" line
          break;
        }
      }

      if (currentModal) modals.push(currentModal);

      modals.forEach(m => {
        const body = m.body.join("\n").trim();
        if (!body) return;
        window._modalQueue.push({ title: m.title, body });
        queued = true;
      });
    }

    if (queued) {
      console.log(`[formatter] queued modals: ${window._modalQueue.length}`);
      window.dispatchEvent(new CustomEvent("ae:modalQueued"));
    }

    // --- STEP 4: Inline formatting ---
    let html = text
      .replace(/\*h\*(.*?)\*h\*/g, "<h4 style='margin:4px 0;'>$1</h4>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/##\s*(.*?)\s*##/g, "<strong>$1</strong>")
      .replace(/(^|\n)(-- .*(?:\n-- .*)*)/g, (match, p1, p2) => {
        const items = p2
          .split(/\n/)
          .map(l => l.replace(/^\s*-- /, "").trim())
          .filter(Boolean)
          .map(t => `<li>${t}</li>`)
          .join("");
        return `${p1}<ul style="margin-left:20px; margin-top:2px; margin-bottom:2px;">${items}</ul>`;
      })
      .replace(/(^|\n)(- .*(?:\n- .*)*)/g, (match, p1, p2) => {
        const items = p2
          .split(/\n/)
          .map(l => l.replace(/^\s*- /, "").trim())
          .filter(Boolean)
          .map(t => `<li>${t}</li>`)
          .join("");
        return `${p1}<ul style="margin-top:2px; margin-bottom:2px;">${items}</ul>`;
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
      const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          m.addedNodes.forEach(node => {
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
