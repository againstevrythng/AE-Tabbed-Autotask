// background.js — MV3 Service Worker
const AUTOTASK_PATTERN = "https://*.autotask.net/*";
const AUTOTASK_MATCH_RE = /^https?:\/\/[^/]*autotask\.net\//i;

function isAutotaskUrl(url) {
  return AUTOTASK_MATCH_RE.test(url || "");
}

// --- Placeholder functions (contentSettings removed in MV3) ---
function addPopupAllow() {
  console.log("[AE Tabs] Popup allow preference set (MV3 no-op)");
}

function clearPopupSettings() {
  console.log("[AE Tabs] Popup allow preference cleared (MV3 no-op)");
}

// --- Helper: Move a tab from a popup window into the main window ---
function moveToMainWindow(tabId, activate = true) {
  chrome.windows.getLastFocused({ windowTypes: ["normal"] }, (mainWin) => {
    if (chrome.runtime.lastError || !mainWin) return;

    chrome.storage.sync.get(["nextTab"], (cfg) => {
      const placeNext = cfg.nextTab !== false; // default true
      const updateTab = () => activate && chrome.tabs.update(tabId, { active: true });

      if (placeNext) {
        chrome.tabs.query({ active: true, windowId: mainWin.id }, (activeTabs) => {
          const idx = activeTabs?.[0]?.index + 1 || -1;
          chrome.tabs.move(tabId, { windowId: mainWin.id, index: idx }, () => {
            if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError);
            updateTab();
          });
        });
      } else {
        chrome.tabs.move(tabId, { windowId: mainWin.id, index: -1 }, () => {
          if (chrome.runtime.lastError) console.warn(chrome.runtime.lastError);
          updateTab();
        });
      }
    });
  });
}

// --- Initialize defaults on install/update ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["nextTab", "rename", "popup"], (res) => {
    const updates = {};
    if (res.nextTab === undefined) updates.nextTab = true;
    if (res.rename === undefined) updates.rename = true;
    if (res.popup === undefined) updates.popup = true;

    if (Object.keys(updates).length) chrome.storage.sync.set(updates);

    const allowPopups = res.popup === undefined ? true : !!res.popup;
    if (allowPopups) addPopupAllow(); else clearPopupSettings();
  });
});

// --- React to settings changes ---
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.popup) {
    if (changes.popup.newValue) addPopupAllow();
    else clearPopupSettings();
  }

  // Trigger title rename re-run
  if (changes.rename && changes.rename.newValue) {
    chrome.tabs.query({ url: AUTOTASK_PATTERN }, (tabs) => {
      tabs.forEach((tab) => {
        if (!tab.id) return;
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["title.js"]
        }).catch(err => console.warn("[AE Tabs] rename inject failed:", err));
      });
    });
  }
});

// --- Handle new popup windows ---
chrome.windows.onCreated.addListener((createdWin) => {
  chrome.windows.get(createdWin.id, { populate: true }, (w) => {
    if (chrome.runtime.lastError || !w) return;
    if (w.type && w.type !== "popup") return;

    const t = (w.tabs && w.tabs[0]) || null;
    if (!t || !isAutotaskUrl(t.url)) return;

    moveToMainWindow(t.id);
  });
});

// --- Handle tabs that navigate to Autotask after creation ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab || !tab.windowId) return;
  if (!changeInfo.url && changeInfo.status !== "complete") return;
  if (!isAutotaskUrl(tab.url)) return;

  chrome.windows.get(tab.windowId, {}, (win) => {
    if (chrome.runtime.lastError || !win) return;
    if (win.type && win.type !== "popup") return;
    moveToMainWindow(tabId);
  });
});
