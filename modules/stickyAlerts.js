// stickyalerts.js v4
// Sticky, collapsible, resizable Autotask alert panel with auto-height expansion,
// dynamic body padding, and session state persistence.

(function () {

    /**************************
     *  Inject required CSS
     **************************/
    (function injectStyles() {
        const css = `
#StickyMessageWrapper {
    position: sticky;
    top: 42px; /* adjust if needed depending on your header */
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
`;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    })();



    /**************************
     *  State Handling
     **************************/
    const SESSION_KEY = "StickyAlertState_v4";

    function loadState() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {
                expanded: false,
                height: 180
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
     *  Body Padding Logic
     **************************/
    function updateBodyPadding(wrapperHeight) {
        const body = document.body;
        if (!body) return;

        // Read current padding-top
        const current = parseInt(getComputedStyle(body).paddingTop, 10);
        const previous = parseInt(body.dataset.stickyPad || "0", 10);

        // Remove previous adjustments to avoid cumulative padding.
        const base = (isNaN(current) ? 105 : current) - previous;

        // Apply new padding
        const newPad = base + wrapperHeight;

        body.style.paddingTop = `${newPad}px`;
        body.dataset.stickyPad = wrapperHeight;
    }



    /**************************
     *  Content Height Logic
     **************************/
    function autoHeight() {
        const clone = document.querySelector('#StickyMessageBar');
        if (!clone) return state.height;

        // Add toggle bar height (approx 32–35px)
        return clone.scrollHeight + 35;
    }



    /**************************
     *  Expand / Collapse
     **************************/
    function togglePanel(wrapper, btn) {
        state.expanded = !state.expanded;

        if (state.expanded) {
            const h = autoHeight();
            state.height = h;
            wrapper.style.height = `${h}px`;
            btn.innerHTML = "▲ Alerts";
            updateBodyPadding(h);
        } else {
            wrapper.style.height = "32px";
            btn.innerHTML = "▼ Alerts";
            updateBodyPadding(32);
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
            updateBodyPadding(newHeight);
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

            // Initialize height
            wrapper.style.height = state.expanded ? `${state.height}px` : "32px";

            // Toggle bar
            const collapseBtn = document.createElement("div");
            collapseBtn.classList.add("StickyToggleBar");
            collapseBtn.innerHTML = state.expanded ? "▲ Alerts" : "▼ Alerts";
            collapseBtn.onclick = () => togglePanel(wrapper, collapseBtn);

            // Resizer
            const resizer = document.createElement("div");
            resizer.classList.add("StickyResizer");
            resizer.onmousedown = initResize(wrapper);

            // Clone original message bar
            clone = original.cloneNode(true);
            clone.id = "StickyMessageBar";
            clone.classList.add("StickyMessageBarFixed");

            header.appendChild(wrapper);
            wrapper.appendChild(collapseBtn);
            wrapper.appendChild(clone);
            wrapper.appendChild(resizer);

            // Hide original but keep layout
            original.style.opacity = "0";
            original.style.pointerEvents = "none";
            original.style.height = "0px";
        }

        // Update clone with new content
        clone.innerHTML = original.innerHTML;

        // Auto-adjust if currently expanded
        if (state.expanded) {
            const needed = autoHeight();
            const finalHeight = Math.max(state.height, needed);

            wrapper.style.height = `${finalHeight}px`;
            state.height = finalHeight;

            updateBodyPadding(finalHeight);
            saveState(state);
        } else {
            updateBodyPadding(32);
        }
    }



    /**************************
     *  Watch Autotask Alerts
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
