(() => {
  console.log("Modal Handler Loaded");

  const processed = new Set();
  const keyOf = (m) => `${m.title}::${m.body}`;

  function htmlFromBody(body) {
    const lines = body.split(/\n/);
    const bullets = lines.filter(l => l.trim().startsWith("•")).map(l => l.replace(/^•\s*/, "").trim());
    const nonBullets = lines.filter(l => !l.trim().startsWith("•"));

    let html = "";
    if (nonBullets.length) {
      html += `<p class="ta-modal-text">${nonBullets.join("\n")}</p>`;
    }
    if (bullets.length) {
      html += `<ul class="ta-modal-list">${bullets.map(b => `<li>${b}</li>`).join("")}</ul>`;
    }
    return html || `<p class="ta-modal-text">${body}</p>`;
  }

  function createModal({ title, body }, onClose) {
    const overlay = document.createElement("div");
    overlay.className = "ta-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "ta-modal";

    modal.innerHTML = `
      <div class="ta-modal-header">
        <span class="ta-modal-title">${title}</span>
        <span class="ta-modal-close">×</span>
      </div>

      <div class="ta-modal-body">
        ${htmlFromBody(body)}
      </div>

      <div class="ta-modal-footer">
        <button class="ta-btn ta-btn-primary">OK</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    modal.querySelector(".ta-modal-close").onclick = close;
    modal.querySelector(".ta-btn-primary").onclick = close;

    if (onClose) {
      modal.querySelector(".ta-btn-primary")
        .addEventListener("click", onClose);
    }
  }

  // Queue logic preserves your behaviour
  let draining = false;

  function drainQueue() {
    const queue = window._modalQueue || [];
    if (!queue.length) {
      draining = false;
      return;
    }
    if (draining) return;
    draining = true;

    const next = () => {
      const item = queue.find(m => !processed.has(keyOf(m)));
      if (!item) {
        draining = false;
        return;
      }
      processed.add(keyOf(item));
      createModal(item, () => setTimeout(next, 10));
    };

    next();
  }

  window.addEventListener("ae:modalQueued", () => setTimeout(drainQueue, 50));

  const startDrain = () => setTimeout(drainQueue, 100);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDrain);
  } else {
    startDrain();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") drainQueue();
  });

  setTimeout(drainQueue, 1000);
})();
