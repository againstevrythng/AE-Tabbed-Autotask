(() => {
  console.log("Formatting Tips Injector Loaded (Single Block)");

  function createTipsBlock() {
    const div = document.createElement("div");
    div.className = "formatting-tips";
    div.style.cssText = `
      background: #f9f9f9;
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 10px 12px;
      margin: 10px 0;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial;
    `;
    div.innerHTML = `
      <strong>Formatting Instructions</strong><br>
      • <code>-</code> Bullet<br>
      • <code>--</code> Indented bullet<br>
      • <code>**Bold**</code> Bold text<br>
      • <code>##Title##</code> Start modal block<br>
      • <code>&gt;</code> New modal line<br>
      • <code>&gt;&gt;</code> Continuation within same modal<br>
      • Non-&gt; lines end the modal body
    `;
    return div;
  }

  function injectTips() {
    // Look for toolbar inside the active Accessory tab
    const activeTab = document.querySelector(".AccessoryTabContainer.Active");
    if (!activeTab) return;

    const toolbar = activeTab.querySelector(".ToolBar");
    const section = activeTab.querySelector(".Simple.Normal.NoHeading.Section");

    if (!toolbar || !section) return;

    // Prevent duplicates
    if (activeTab.querySelector(".formatting-tips")) return;

    const tips = createTipsBlock();
    toolbar.parentNode.insertBefore(tips, section);
    console.log("[inserttips] Formatting instructions inserted under toolbar.");
  }

  // Retry until section appears
  let tries = 0;
  const interval = setInterval(() => {
    injectTips();
    tries++;
    if (document.querySelector(".formatting-tips") || tries > 20) {
      clearInterval(interval);
    }
  }, 500);

  // Also re-inject when DOM changes (e.g. new tab opened)
  const observer = new MutationObserver(() => {
    if (!document.querySelector(".formatting-tips")) injectTips();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
