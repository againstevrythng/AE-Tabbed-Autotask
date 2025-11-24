// stickyalerts.js v3
// Sticky, collapsible, resizable Autotask alert panel with auto-height expansion and session state.

(function () {

    /**************************
     *  Inject required CSS
     **************************/
    (function injectStyles() {
        const css = `
#StickyMessageWrapper {
    position: sticky;
    top: 42px; /* adjust if your UI shifts */
    width: 100%;
    background: #fff;
    z-index: 999999;
    border-bottom: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    transition: height 150ms ease;
}

.StickyToggleBar {
    background: #eee;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid #ccc;
}

.StickyResizer {
    height: 6px;
    cursor: ns-resize;
    background: #ddd;
}

.StickyMessageBarFixed {
    flex: 1;
    overflow-y: auto;
}

.MessageBarContainer.Active {
    margin-bottom: 0px;
}
`;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    })();


    /**************************
     *  State Handling
     **************************/
    const SESSION_KEY = "StickyAlertState_v3";

    function loadState() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {
                expanded: false,
                height: 180 // default expanded height
            };
        } catch {
            return { expanded: false, height: 180 };
        }
    }

    function saveState(state) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }

    let state = loadState();
    let updateTimeout = null;


    /**************************
     *  Calculate Auto Height
     **************************/
    function autoHeight() {
        const clone = document.querySelector('#StickyMessageBar');
        if (!clone) return state.height;
        return clone.scrollHeight + 35; // include toggle bar
    }


    /**************************
     *  Expand / Collapse
     **************************/
    function togglePanel(wrapper, btn) {
        state.expanded = !state.expanded;

        if (state.expanded) {
            const h = autoHeight();
            wrapper.style.height = `${h}px`;
            state.height = h;
            btn.innerHTML = "▲ Alerts";
        } else {
            wrapper.style.height = "32px";
            btn.innerHTML = "▼ Alerts";
        }

        saveState(state);
    }


    /**************************
     *  Resize Logic
     **************************/
    let startY, startHeight;

    function initResize(wrapper) {
        return function (e) {
            if (!state.expanded) return;

            startY = e.clientY;
            startHeight = parseInt(getComputedStyle(wrapper).height, 10);

            document.addEventListener('mousemove', doResize, false);
            document.addEventListener('mouseup', stopResize, false);
        };
    }

    function doResize(e) {
        const wrapper = document.querySelector('#StickyMessageWrapper');
        if (!wrapper) return;

        const newHeight = startHeight + (e.clientY - startY);

        if (newHeight >= 60 && newHeight <= 600) {
            wrapper.style.height = `${newHeight}px`;
            state.height = newHeight;
        }
    }

    function stopResize() {
        saveState(state);
        document.removeEventListener('mousemove', doResize, false);
        document.removeEventListener('mouseup', stopResize, false);
    }


    /**************************
     *  Clone + Sync
     **************************/
    function syncStickyAlerts() {
        const original = document.querySelector('.MessageBarContainer');
        const header = document.querySelector('.PageHeadingContainer');

        if (!original || !header) return;

        let wrapper = document.querySelector('#StickyMessageWrapper');
        let clone = document.querySelector('#StickyMessageBar');

        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.id = "StickyMessageWrapper";
            wrapper.classList.add("StickyMessageWrapper");

            // Set height based on state
            wrapper.style.height = state.expanded ? `${state.height}px` : "32px";

            // UI: toggle bar
            const collapseBtn = document.createElement("div");
            collapseBtn.classList.add("StickyToggleBar");
            collapseBtn.innerHTML = state.expanded ? "▲ Alerts" : "▼ Alerts";
            collapseBtn.onclick = () => togglePanel(wrapper, collapseBtn);

            // UI: resizer
            const resizer = document.createElement("div");
            resizer.classList.add("StickyResizer");
            resizer.onmousedown = initResize(wrapper);

            // Create clone
            clone = original.cloneNode(true);
            clone.id = "StickyMessageBar";
            clone.classList.add("StickyMessageBarFixed");

            // Build UI structure
            header.appendChild(wrapper);
            wrapper.appendChild(collapseBtn);
            wrapper.appendChild(clone);
            wrapper.appendChild(resizer);

            // Keep original for layout but invisible
            original.style.opacity = "0";
            original.style.pointerEvents = "none";
            original.style.height = "0px";
        }

        clone.innerHTML = original.innerHTML;

        // If expanded, auto-adjust height to fit content
        if (state.expanded) {
            const needed = autoHeight();
            wrapper.style.height = `${Math.max(state.height, needed)}px`;
            state.height = Math.max(state.height, needed);
            saveState(state);
        }
    }


    /**************************
     *  Mutation Observer
     **************************/
    function observeOriginal() {
        const original = document.querySelector('.MessageBarContainer');
        if (!original) return setTimeout(observeOriginal, 300);

        const observer = new MutationObserver(() => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(syncStickyAlerts, 60);
        });

        observer.observe(original, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });
    }


    /**************************
     *  Init
     **************************/
    function init() {
        if (!document.querySelector('.PageHeadingContainer')) {
            return setTimeout(init, 300);
        }

        observeOriginal();
        syncStickyAlerts();
    }

    init();

})();
