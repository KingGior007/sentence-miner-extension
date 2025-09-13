let currentNetflixObserver = null;
let lastTimeOutIdNetflix = null;
const setupNetflixObserver = () => {
    try {
        const container = document.querySelector(".player-timedtext-text-container").parentElement;
        container.style.display = "none"

        if (lastTimeOutIdNetflix !== null) {
            clearTimeout(lastTimeOutIdNetflix);
        }

        if (currentNetflixObserver) {
            currentNetflixObserver.disconnect();
        }

        addOverlay();
        let overlay = document.getElementsByClassName('custom-overlay')[0];
        overlay.innerHTML = "Fetching subtitles";

        const observer = new MutationObserver((mutationsList) => {
            container.style.display = "none"
            for (const mutation of mutationsList) {
                mutation.addedNodes.forEach((node) => {
                    // Ensure the node is an element (not a text node) and contains subtitle text
                    if (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim() && lastSub != node.textContent.trim()) {
                        lastSub = node.textContent.trim();

                        // TODO: Use kuromoji for segmentation here
                        // And add the initialization of the tokenizer somewhere else
                        const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'word' });
                        const segments = [...segmenter.segment(lastSub)].map(segment => segment.segment);

                        chrome.runtime.sendMessage({ action: "known-list", wordList: segments }, (res) => {
                            console.log(res);
                            overlay.innerHTML = segments.map((segment, index) => {
                                if (segment.match(japanesePunctuation)) return `<span>${segment}</span>`;
                                else return `<span class="segment-word ${res[index] ? "known" : ""}" data-word="${segment}">${segment}</span>`
                            }).join('');

                            document.querySelectorAll('.segment-word').forEach(span => {
                                span.tabIndex = 0;
                                span.addEventListener('focus', (e) => showPopup(e, lastSub));
                                span.addEventListener('blur', hidePopup);
                            });
                        })
                    }
                });
            }
        });

        observer.observe(container, {
            childList: true,  // Watch for added/removed children
            subtree: true,    // Monitor all nested elements
            attributes: false // Don't track attribute changes (optional)
        });
        currentNetflixObserver = observer;

        console.log("Observer set up successfully!");
    } catch {
        console.log("Subtitle container not found, retrying...");
        lastTimeOutIdNetflix = setTimeout(setupNetflixObserver, 1000); // Retry every second
    }
};
