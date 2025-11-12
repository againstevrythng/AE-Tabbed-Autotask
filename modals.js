(() => {
  console.log("Modal Handler Loaded");

  function createModal({ title, body }) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    animation: aeFadeIn 0.25s ease forwards;
  `;

  const modal = document.createElement("div");
  modal.style.cssText = `
    background: #fff;
    color: #222;
    border-radius: 10px;
    padding: 22px 24px;
    min-width: 400px;
    min-height: 250px;
    max-width: 600px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transform: scale(0.98);
    animation: aeModalPop 0.25s ease forwards;
  `;

  // Simple inline keyframes
  const style = document.createElement("style");
  style.textContent = `
    @keyframes aeFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes aeModalPop {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  modal.innerHTML = `
    <div style="flex:1; overflow-y:auto;">
      <h3 style="margin-top:0; margin-bottom:0.5em; font-size:18px;">${title}</h3>
      <p style="white-space:pre-line; line-height:1.45; margin:0;">${body}</p>
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
      >
        OK
      </button>
    </div>
  `;

  modal.querySelector("button").onclick = () => overlay.remove();
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}


  function processModals() {
    if (!window._modalQueue?.length) return;
    const queue = [...window._modalQueue];
    window._modalQueue = [];
    queue.forEach(createModal);
  }

  // Trigger after small delay to allow formatter to finish
  setTimeout(processModals, 1000);
})();
