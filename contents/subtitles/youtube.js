const countUp = (timeStamp) => {
    function to2Digits(int) {
        return int < 10 ? "0" + String(int) : String(int);
    }

    let [minute, second] = timeStamp.split(":").map(Number); // Ensure minute is first, second is second
    second += 1; // Increment seconds

    if (second > 59) {
        minute++;   // Increment minute if seconds exceed 59
        second = 0; // Reset seconds to 0
    }

    return minute + ":" + to2Digits(second); // Return formatted time
};

function getTranscript() {
    const subContainers = document.querySelectorAll("ytd-engagement-panel-section-list-renderer.style-scope.ytd-watch-flexy");

    for (const subContainer of subContainers) {
        const computedStyle = getComputedStyle(subContainer);
        if (computedStyle.order && Number(computedStyle.order) <= 0 &&
            subContainer.getAttribute("target-id") == "engagement-panel-searchable-transcript") {
            return subContainer;
        }
    }
    return null
}

function getSubtitle(subtitles, currentSubtitle, lastTimeStampUpdate) {
    for (const subtitle of subtitles) {
        if (subtitle.children[0].children[0].children[0].textContent.trim() === String(lastTimeStampUpdate).trim() &&
            currentSubtitle !== subtitle.children[0].children[2].textContent.trim()) {

            return subtitle.children[0].children[2].textContent.trim();
        }
    }
}

function processSubtitle(currentSubtitle, overlay) {
    const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
    const segments = [...segmenter.segment(currentSubtitle)].map(segment => segment.segment);
    chrome.runtime.sendMessage({ action: "known-list", wordList: segments }, (res) => {
        overlay.innerHTML = segments.map((segment, index) => {
            if (segment.match(japanesePunctuation)) return `<span>${segment}</span>`;
            else return `<span class="segment-word ${res[index] ? "known" : ""}" data-word="${segment}">${segment}</span>`;
        }).join('');

        document.querySelectorAll('.segment-word').forEach(span => {
            span.tabIndex = 0;
            span.addEventListener('focus', (e) => showPopup(e, currentSubtitle));
            span.addEventListener('blur', hidePopup);
        });
    });
}

function setupKeyboardShortcuts() {
    const BIND = { rewind: 'a', forward: 'd', toggle: 's' };
    function keyHandler(e) {
        // don't break combos or typing
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

        const key = (e.key || '').toLowerCase();
        if (![BIND.rewind, BIND.forward, BIND.toggle].includes(key)) return;

        // stop other handlers / default behaviour
        e.preventDefault();
        e.stopImmediatePropagation();

        const v = document.querySelector('video');
        if (!v) { console.log('No <video> element found.'); return; }

        if (key === BIND.rewind) v.currentTime = Math.max(0, v.currentTime - 3);
        else if (key === BIND.forward) v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 3);
        else if (key === BIND.toggle) v.paused ? v.play() : v.pause();
    }

    document.addEventListener('keydown', keyHandler, { capture: true, passive: false });

    // small floating badge so you remember the bindings (temporary)
    const badge = document.createElement('div');
    badge.id = 'yt-wasd-badge';
    badge.textContent = `${BIND.rewind}: -3s   ${BIND.forward}: +3s   ${BIND.toggle}: play/pause`;
    Object.assign(badge.style, {
        position: 'fixed', right: '10px', bottom: '10px', zIndex: 2147483647,
        padding: '6px 10px', fontSize: '12px', background: '#000', color: '#fff',
        opacity: 0.78, borderRadius: '6px', pointerEvents: 'none'
    });
    document.body.appendChild(badge);

    // expose quick controls
    window._ytADSM = {
        bindings: BIND,
        remove() {
            try { document.removeEventListener('keydown', keyHandler, { capture: true }); } catch (e) { }
            try { document.removeEventListener('keydown', keyHandler, true); } catch (e) { }
            const el = document.getElementById('yt-wasd-badge'); if (el) el.remove();
            delete window._ytADSM;
            console.log('Removed custom a/d/s handlers and badge.');
        }
    };

    console.log(`Bound keys: ${BIND.rewind} (−3s), ${BIND.forward} (+3s), ${BIND.toggle} (play/pause). Remove with: window._ytADSM.remove()`);
}

function setupYoutubeObserver() {
    let currentSubtitle;
    let isPaused = true;
    addOverlay();
    setupKeyboardShortcuts();

    let overlay = document.querySelector('.custom-overlay');
    overlay.textContent = "Fetching subtitles";
    let lastIntervalId = null;

    try {
        // Remove a bad looking gradient
        document.querySelector(".ytp-gradient-bottom").style.display = "none";
        // Disable youtube's subtitles

        // NOTE: probably make an observer to hide the subs
        let captions = document.querySelector("button.ytp-subtitles-button.ytp-button");
        if (captions && captions.getAttribute("aria-pressed") == "true") {
            captions.click()
        }

        // Get the subtitle container
        let transcript = getTranscript();

        if (transcript) {
            let lastTimeStampUpdate;
            const timeStampContainer = document.querySelector(".ytp-time-current")

            // Expand the transcript
            transcript.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED");

            const observerConfig = {
                childList: true, // Detects changes to the children of the target node
                subtree: true,   // Ensures observation extends to all descendants
                characterData: true // Detects changes to the `textContent` of text nodes
            };

            function updateTimeStamp() {
                if (lastTimeStampUpdate && !isPaused) {
                    lastTimeStampUpdate = countUp(lastTimeStampUpdate);
                    const subtitles = document.querySelectorAll("ytd-transcript-segment-renderer.style-scope.ytd-transcript-segment-list-renderer");

                    currentSubtitle = getSubtitle(subtitles, currentSubtitle, lastTimeStampUpdate)
                    if (currentSubtitle === undefined) return;

                    processSubtitle(currentSubtitle, overlay);
                }
            }

            const onNewTimeStamp = () => {
                const subtitles = document.querySelectorAll("ytd-transcript-segment-renderer.style-scope.ytd-transcript-segment-list-renderer");
                const timeStamp = document.querySelector(".ytp-time-current").innerHTML;
                lastTimeStampUpdate = timeStamp;
                if (lastIntervalId !== null) {
                    clearInterval(lastIntervalId);
                }
                lastIntervalId = setInterval(updateTimeStamp, 1000);

                currentSubtitle = getSubtitle(subtitles, currentSubtitle, lastTimeStampUpdate);
                if (currentSubtitle === undefined) return;

                processSubtitle(currentSubtitle, overlay);
            }

            const observer = new MutationObserver(onNewTimeStamp);

            observer.observe(timeStampContainer, observerConfig);

            console.log("Observer set up successfully!");

            const targetNode = document.querySelector('#movie_player');

            if (targetNode) {
                const observer = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const element = mutation.target;
                            if (element.classList.contains("paused-mode")) {
                                isPaused = true;
                            }
                            else {
                                isPaused = false;
                            }
                        }
                    }
                });

                const config = {
                    attributes: true,
                    attributeFilter: ['class'],
                };

                observer.observe(targetNode, config);

                console.log('Mutation observer is active');
            } else {
                console.error('Target node not found');
            }

            lastIntervalId = setInterval(updateTimeStamp, 1000);
        }
        else {
            console.log("Subtitle container not found, retrying...");
            setTimeout(setupYoutubeObserver, 1000); // Retry every second
        }
    } catch {
        console.log("Subtitle container not found, retrying...");
        setTimeout(setupYoutubeObserver, 1000); // Retry every second
    }
}
