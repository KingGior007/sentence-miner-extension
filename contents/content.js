let lastSub;
const japanesePunctuation = /[！〜、。・：「」『』【】（）［］｛｝！＃＄％＆’（）＊＋，－．／：；＜＝＞＠［＼］＾＿｀｛｜｝～「」『』〆〤… 　 ？♪]/g;


const setupNetflixObserver = () => {
    addOverlay();
    let overlay = document.getElementsByClassName('custom-overlay')[0];
    overlay.textContent = 'Fetching subtitles...';
    try {
        const container = document.querySelector(".player-timedtext-text-container").parentElement;
        container.style.display = "none"

        const observer = new MutationObserver((mutationsList, observer) => {
            container.style.display = "none"
            for (const mutation of mutationsList) {
                // Only log if added nodes are relevant (i.e., if they contain text)
                mutation.addedNodes.forEach((node) => {
                    // Ensure the node is an element (not a text node) and contains subtitle text
                    if (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim() && lastSub != node.textContent.trim()) {
                        lastSub = node.textContent.trim();

						const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
                        const segments = [...segmenter.segment(lastSub)].map(segment => segment.segment);
                        overlay.innerHTML = segments.map((segment) => {
                            if (segment.match(japanesePunctuation)) return `<span>${segment}</span>`;
                            else return `<span class="segment-word" data-word="${segment}">${segment}</span>`
                        }).join('');

                        document.querySelectorAll('.segment-word').forEach(span => {
                            // span.addEventListener('mouseenter', showPopup);
                            // span.addEventListener('mouseleave', hidePopup);
                            span.tabIndex = 0;
                            span.addEventListener('focus', (e) => showPopup(e, lastSub));
                            span.addEventListener('blur', hidePopup);
                        });
                    }
                });
            }
        });

        observer.observe(container, {
            childList: true,  // Watch for added/removed children
            subtree: true,    // Monitor all nested elements
            attributes: false // Don't track attribute changes (optional)
        });

        console.log("Observer set up successfully!");
    } catch {
        console.log("Subtitle container not found, retrying...");
        setTimeout(setupNetflixObserver, 1000); // Retry every second
    }
};

function setupYoutubeObserver() {
    createExtensionButtons();
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

    let currentSubtitle;
    let isPaused = true;
    addOverlay();
    let overlay = document.querySelector('.custom-overlay');
    let lastIntervalId = null;

    function getIsPaused() {
        // Select the target node to observe
        const targetNode = document.querySelector('#movie_player');

        // Ensure the target node exists
        if (targetNode) {
            // Create an observer instance
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    // Check if the mutation involves attribute changes
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const element = mutation.target;
                        // if (element.classList.contains('ytp-autohide')) {
                        //     element.classList.remove('ytp-autohide');
                        //     element.classList.remove('ytp-large-width-mode')
                        // }
                        if (element.classList.contains("paused-mode")) {
                            isPaused = true;
                        }
                        else {
                            isPaused = false;
                        }
                    }
                }
            });

            // Observer configuration
            const config = {
                attributes: true, // Observe attribute changes
                attributeFilter: ['class'], // Only watch for changes to the 'class' attribute
            };

            // Start observing the target node
            observer.observe(targetNode, config);

            console.log('Mutation observer is active');
        } else {
            console.error('Target node not found');
        }
    }
    try {
        // clicks on an element in the youtube video in order to keep the timestamp element from being disabled
        // document.querySelector("button.ytp-button.ytp-settings-button.ytp-hd-quality-badge").click();
        // document.querySelector(".ytp-chrome-bottom").style.display = "none";
        document.querySelector(".ytp-gradient-bottom").style.display = "none";
        // document.querySelector(".ytp-popup.ytp-settings-menu").style.display = "none";
        let captions = document.querySelector("button.ytp-subtitles-button.ytp-button");
        if (captions && captions.getAttribute("aria-pressed") == "true") {
            captions.click()
        }

        // NOTE probably make an observer to hide the subs
        let container;
        const subContainers = document.querySelectorAll("ytd-engagement-panel-section-list-renderer.style-scope.ytd-watch-flexy");

        for (const subContainer of subContainers) {
            const computedStyle = getComputedStyle(subContainer);
            if (computedStyle.order && Number(computedStyle.order) <= 0 &&
             subContainer.getAttribute("target-id") == "engagement-panel-searchable-transcript") {
                container = subContainer; 
                break; 
            }
        }

        if (container) {
            let lastTimeStampUpdate;
            const timeStampContainer = document.querySelector(".ytp-time-current")
            container.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED");
            const observerConfig = {
                childList: true, // Detects changes to the children of the target node
                subtree: true,   // Ensures observation extends to all descendants
                characterData: true // Detects changes to the `textContent` of text nodes
            };

            function updateTimeStamp() {
                if (lastTimeStampUpdate && !isPaused) {
                    lastTimeStampUpdate = countUp(lastTimeStampUpdate);
                    const subtitles = document.querySelectorAll("ytd-transcript-segment-renderer.style-scope.ytd-transcript-segment-list-renderer");
                    for (const subtitle of subtitles) {
                        if (subtitle.children[0].children[0].children[0].textContent.trim() === String(lastTimeStampUpdate).trim() &&
                            currentSubtitle !== subtitle.children[0].children[2].textContent.trim()) {
                            if (currentSubtitle !== subtitle.children[0].children[2].textContent.trim()) 
                            currentSubtitle = subtitle.children[0].children[2].textContent.trim();
                            break;
                        }
                    }
                    if (currentSubtitle === undefined) { console.log("returning", `subtitle: ${currentSubtitle}`); return };
                    // if (!isJapanese(lastSub)) {overlay.remove(); return};

                    const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
                    const segments = [...segmenter.segment(currentSubtitle)].map(segment => segment.segment);
                    overlay.innerHTML = segments.map((segment) => {
                        if (segment.match(japanesePunctuation)) return `<span>${segment}</span>`;
                        else return `<span class="segment-word" data-word="${segment}">${segment}</span>`;
                    }).join('');

                    document.querySelectorAll('.segment-word').forEach(span => {
                        span.tabIndex = 0;
                        span.addEventListener('focus', (e) => showPopup(e, currentSubtitle));
                        span.addEventListener('blur', hidePopup);
                    });
                }
            }

            const onNewTimeStamp = () => {
                const subtitles = document.querySelectorAll("ytd-transcript-segment-renderer.style-scope.ytd-transcript-segment-list-renderer");
                const timeStamp = document.querySelector(".ytp-time-current").innerHTML;
                lastTimeStampUpdate = timeStamp; 
                if (lastIntervalId !== null) {
                    clearInterval(lastIntervalId);
                    lastIntervalId = setInterval(updateTimeStamp, 1000);
                }
                for (const subtitle of subtitles) {
                    if (subtitle.children[0].children[0].children[0].textContent.trim() === String(timeStamp).trim() &&
                            currentSubtitle !== subtitle.children[0].children[2].textContent.trim()) {
                        currentSubtitle = subtitle.children[0].children[2].textContent;
                        break;
                    }
                } 

                if (currentSubtitle === undefined) return;
                // if (!isJapanese(lastSub)) {
                //     overlay.remove();
                //     document.querySelector(".ytp-chrome-bottom").style.display = "block";
                //     container.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN");
                //     return
                // };
                        
				const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
                const segments = [...segmenter.segment(currentSubtitle)].map(segment => segment.segment.replace("<", "").replace(">", ""));
                overlay.innerHTML = segments.map((segment) => {
                    if (segment.match(japanesePunctuation)) return `<span>${segment}</span>`;
                    else return `<span class="segment-word" data-word="${segment}">${segment}</span>`;
                }).join('');

                document.querySelectorAll('.segment-word').forEach(span => {
                    span.tabIndex = 0;
                    span.addEventListener('focus', (e) => showPopup(e, currentSubtitle));
                    span.addEventListener('blur', hidePopup);
                });
            }

            const observer = new MutationObserver(onNewTimeStamp);

            observer.observe(timeStampContainer, observerConfig);

            console.log("Observer set up successfully!");

            getIsPaused()

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

function setPathObserver(){
    let currentPath;
    const onDomChange = () => {
        if (currentPath !== window.location.pathname) {
            currentPath = window.location.pathname;

            if (window.location.origin == "https://www.netflix.com" && currentPath.startsWith('/watch')) {
                console.log("Entered a Netflix watch page.");
                setupNetflixObserver(); // Function to execute when entering a watch page
            }
            else if (window.location.origin == "https://www.youtube.com" && currentPath.startsWith('/watch')) {
                console.log("Entered a Youtube watch page")
                setupYoutubeObserver();
            }
            else {
                console.log("Left the watch page.");
                disableNetflixSubs();
            }
        }
    };

    // Observe changes in the body element
    const observer = new MutationObserver(onDomChange);
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("Path observer initialized.");
    onDomChange();
}

window.addEventListener('load', () => {
    setPathObserver();
});