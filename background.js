// MV3 service worker
const AUTOTASK_PATTERN = "https://*.autotask.net/*";
const AUTOTASK_MATCH_RE = /^https?:\/\/[^/]*autotask\.net\//i;

function isAutotaskUrl(url) {
  return AUTOTASK_MATCH_RE.test(url || "");
}

function addPopupAllow() {
  chrome.contentSettings.popups.set({
    primaryPattern: AUTOTASK_PATTERN,
    setting: "allow"
  });
}

function clearPopupSettings() {
  // Clears popups settings set by this extension
  chrome.contentSettings.popups.clear({});
}

// Initialise defaults on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["nextTab", "rename", "popup"], (res) => {
    const updates = {};
    if (res.nextTab === undefined) updates.nextTab = true;
    if (res.rename === undefined) updates.rename = true;
    if (res.popup === undefined) updates.popup = true;

    if (Object.keys(updates).length) {
      chrome.storage.sync.set(updates);
    }

    const allowPopups = res.popup === undefined ? true : !!res.popup;
    if (allowPopups) addPopupAllow(); else clearPopupSettings();
  });
});

// React to settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.popup) {
    if (changes.popup.newValue) addPopupAllow();
    else clearPopupSettings();
  }

  // If rename gets turned on, nudge existing Autotask tabs to re-run the title logic
  if (changes.rename && changes.rename.newValue) {
    chrome.tabs.query({ url: AUTOTASK_PATTERN }, (tabs) => {
      tabs.forEach((tab) => {
        if (!tab.id) return;
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["title.js"]
        });
      });
    });
  }
});

// When a window is created (e.g., Autotask opens a popup), move its tab into the main window
chrome.windows.onCreated.addListener((createdWin) => {
  chrome.windows.get(createdWin.id, { populate: true }, (w) => {
    if (chrome.runtime.lastError || !w) return;
    // Only act on popup windows; leave normal windows alone
    if (w.type && w.type !== "popup") return;

    const t = (w.tabs && w.tabs[0]) || null;
    if (!t || !isAutotaskUrl(t.url)) return;

    // Move into last focused NORMAL window
    chrome.windows.getLastFocused({ windowTypes: ["normal"] }, (mainWin) => {
      if (chrome.runtime.lastError || !mainWin) return;

      chrome.storage.sync.get(["nextTab"], (cfg) => {
        const placeNext = cfg.nextTab !== false; // default true
        if (placeNext) {
          chrome.tabs.query({ active: true, windowId: mainWin.id }, (activeTabs) => {
            const targetIndex = activeTabs && activeTabs[0] ? activeTabs[0].index + 1 : -1;
            chrome.tabs.move(t.id, { windowId: mainWin.id, index: targetIndex }, () => {
              chrome.tabs.update(t.id, { active: true });
            });
          });
        } else {
          chrome.tabs.move(t.id, { windowId: mainWin.id, index: -1 }, () => {
            chrome.tabs.update(t.id, { active: true });
          });
        }
      });
    });
  });
});

// Fallback: if a tab in a popup window navigates to Autotask after creation, rescue it
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab || !tab.windowId) return;
  if (!changeInfo.url && changeInfo.status !== "complete") return;
  if (!isAutotaskUrl(tab.url)) return;

  chrome.windows.get(tab.windowId, {}, (win) => {
    if (chrome.runtime.lastError || !win) return;
    if (win.type && win.type !== "popup") return;

    chrome.windows.getLastFocused({ windowTypes: ["normal"] }, (mainWin) => {
      if (chrome.runtime.lastError || !mainWin) return;

      chrome.storage.sync.get(["nextTab"], (cfg) => {
        const placeNext = cfg.nextTab !== false;
        if (placeNext) {
          chrome.tabs.query({ active: true, windowId: mainWin.id }, (activeTabs) => {
            const targetIndex = activeTabs && activeTabs[0] ? activeTabs[0].index + 1 : -1;
            chrome.tabs.move(tabId, { windowId: mainWin.id, index: targetIndex }, () => {
              chrome.tabs.update(tabId, { active: true });
            });
          });
        } else {
          chrome.tabs.move(tabId, { windowId: mainWin.id, index: -1 }, () => {
            chrome.tabs.update(tabId, { active: true });
          });
        }
      });
    });
  });
});
