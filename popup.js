document.addEventListener("DOMContentLoaded", () => {
  const elNext = document.getElementById("opt_cur");
  const elRename = document.getElementById("opt_rename");
  const elPop = document.getElementById("opt_pop");
  const elFormat = document.getElementById("opt_format");

  function save() {
    chrome.storage.sync.set({
      nextTab: elNext.checked,
      rename: elRename.checked,
      popup: elPop.checked,
      format: elFormat.checked
    });
  }

  chrome.storage.sync.get(["nextTab", "rename", "popup", "format"], (res) => {
    elNext.checked = res.nextTab !== false;
    elRename.checked = res.rename !== false;
    elPop.checked = res.popup !== false;
    elFormat.checked = res.format !== false;
  });

  [elNext, elRename, elPop, elFormat].forEach(el => el.addEventListener("change", save));
});
