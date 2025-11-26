// stickyalerts.js v5
// Sticky, collapsible, resizable Autotask alert panel with
// auto-height expansion, dynamic body padding, click/drag logic,
// minimized-by-default behaviour, and session state persistence.

(function () {

    /**************************
     *  Inject required CSS
     **************************/
    (function injectStyles() {
        const css = `
/* Reduce default margin behind the original alert */
.MessageBarContainer.Active {
    margin-bottom: 1px !important;
}

/*Fix drop-downs being hidden behind Alert bar*/
.ToolBar>.ToolBarItem {
    z-index: 30001 !important;
}

#StickyMessageWrapper {
    position: sticky;
    top: 42px; /* adjust to your header layout */
    width: 100%;
    background: #fff;
    z-index: 3000;
    border-bottom: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    transition: height 150ms ease;
}

.StickyToggleBar {
    background: #ebc785ff;
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
    box-shadow: 0 -1px 3px rgba(0,0,0,0.25);
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
    const SESSION_KEY = "StickyAlertState_v5";

    function loadState() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {
                expanded: false,   // minimized by default
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

        const current = parseInt(getComputedStyle(body).paddingTop, 10);
        const previous = parseInt(body.dataset.stickyPad || "0", 10);

        const base = (isNaN(current) ? 105 : current) - previous;
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
        return clone.scrollHeight + 35; // include toggle bar height
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
     *  Resize Logic (click + drag)
     **************************/
    let startY, startHeight, isDragging = false;
    const dragThreshold = 3;

    function initResize(wrapper) {
        return function (e) {
            startY = e.clientY;
            startHeight = parseInt(getComputedStyle(wrapper).height, 10);
            isDragging = false;

            document.body.style.userSelect = "none";

            document.addEventListener('mousemove', handleDragMove, false);
            document.addEventListener('mouseup', handleDragEnd, false);
        };
    }

    function handleDragMove(e) {
        if (Math.abs(e.clientY - startY) > dragThreshold) {
            isDragging = true;
            doResize(e);
        }
    }

    function handleDragEnd(e) {
        document.body.style.userSelect = "";

        document.removeEventListener('mousemove', handleDragMove, false);
        document.removeEventListener('mouseup', handleDragEnd, false);

        // CLICK on resizer
        if (!isDragging) {
            const wrapper = document.querySelector('#StickyMessageWrapper');
            const btn = document.querySelector('.StickyToggleBar');

            if (!state.expanded) {
                togglePanel(wrapper, btn); // expand on click
            }
        } else {
            // Drag end
            saveState(state);
        }
    }

    function doResize(e) {
        const wrapper = document.querySelector('#StickyMessageWrapper');
        if (!wrapper) return;

        // If minimized → auto-expand on drag
        if (!state.expanded) {
            state.expanded = true;
            wrapper.style.height = `${startHeight}px`;

            const btn = document.querySelector('.StickyToggleBar');
            btn.innerHTML = "▲ Alerts";
        }

        const maxHeight = autoHeight();
        const newHeight = startHeight + (e.clientY - startY);

        if (newHeight >= 60 && newHeight <= maxHeight) {
            wrapper.style.height = `${newHeight}px`;
            state.height = newHeight;
            updateBodyPadding(newHeight);
        }
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

            clone = original.cloneNode(true);
            clone.id = "StickyMessageBar";
            clone.classList.add("StickyMessageBarFixed");

            header.appendChild(wrapper);
            wrapper.appendChild(collapseBtn);
            wrapper.appendChild(clone);
            wrapper.appendChild(resizer);

            original.style.opacity = "0";
            original.style.pointerEvents = "none";
            original.style.height = "0px";
        }

        clone.innerHTML = original.innerHTML;

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
