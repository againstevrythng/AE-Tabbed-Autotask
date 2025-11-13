(() => {
  console.log("Modal Handler Loaded");

  // keep processed entries unique
  const processed = new Set();
  const keyOf = (m) => `${m.title}::${m.body}`;

  function htmlFromBody(body) {
    const lines = body.split(/\n/);
    const bullets = lines.filter(l => l.trim().startsWith("•")).map(l => l.replace(/^•\s*/, "").trim());
    const nonBullets = lines.filter(l => !l.trim().startsWith("•"));

    let html = "";
    if (nonBullets.length) {
      html += `<p style="white-space:pre-line; margin:0 0 .75em 0;">${nonBullets.join("\n")}</p>`;
    }
    if (bullets.length) {
      html += `<ul style="margin:.25em 0 0 1.1em; padding:0;">${bullets.map(b => `<li>${b}</li>`).join("")}</ul>`;
    }
    return html || `<p>${body}</p>`;
  }

  function createModal({ title, body }, onClose) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      animation: aeFadeIn .25s ease forwards;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background:#fff;
      color:#222;
      border-radius:10px;
      padding:22px 24px;
      min-width:400px;
      min-height:250px;
      max-width:600px;
      box-shadow:0 12px 36px rgba(0,0,0,0.35);
      font-family: system-ui,-apple-system,'Segoe UI',Roboto,Arial;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      transform:scale(.98);
      animation: aeModalPop .25s ease forwards;
    `;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes aeFadeIn {from{opacity:0} to{opacity:1}}
      @keyframes aeModalPop {from{transform:scale(.95);opacity:0} to{transform:scale(1);opacity:1}}
    `;
    document.head.appendChild(style);

    modal.innerHTML = `
      <div style="flex:1; overflow-y:auto;">
        <h3 style="margin-top:0; margin-bottom:.5em; font-size:18px;">${title}</h3>
        <div style="font-size:14px; line-height:1.45;">${htmlFromBody(body)}</div>
      </div>
      <div style="text-align:right; margin-top:1.2em;">
        <button
          style="
            background:#0b66d6;
            color:#fff;
            border:none;
            padding:8px 16px;
            border-radius:6px;
            cursor:pointer;
            font-size:14px;
          "
        >OK</button>
      </div>
    `;

    modal.querySelector("button").onclick = () => overlay.remove();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (onClose) modal.querySelector("button").addEventListener("click", onClose);
  }

  // --- Queue draining ---
  let draining = false;

  function drainQueue() {
    const queue = window._modalQueue || [];
    if (!queue.length) {
      console.log("[modals] drainQueue called, but queue empty");
      draining = false;
      return;
    }

    if (draining) return;
    draining = true;
    console.log(`[modals] drainQueue start with ${queue.length} items`);

    const next = () => {
      const item = queue.find(m => !processed.has(keyOf(m)));
      if (!item) {
        draining = false;
        console.log("[modals] queue complete");
        return;
      }
      processed.add(keyOf(item));
      createModal(item, () => setTimeout(next, 10));
    };

    next();
  }

  // --- Event triggers ---
  window.addEventListener("ae:modalQueued", () => {
    console.log("[modals] ae:modalQueued received");
    setTimeout(drainQueue, 50); // let DOM settle
  });

  // --- Safety timers ---
  const startDrain = () => setTimeout(drainQueue, 100);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startDrain);
  } else {
    startDrain();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") drainQueue();
  });

  // Final fallback
  setTimeout(drainQueue, 1000);
})();
