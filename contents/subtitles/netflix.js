function extractSubtitleWithFurigana(container) {
    if (!container) return [];
    const html = container.innerHTML;
    const result = [];
    const rubyRegex = /<ruby[^>]*>(.*?)<rt>(.*?)<\/rt><\/ruby>/gi;
    let lastIndex = 0;
    let match;

    while ((match = rubyRegex.exec(html)) !== null) {
        // Add any text before this ruby
        const textBefore = html.slice(lastIndex, match.index).replace(/<[^>]+>/g, '').trim();
        if (textBefore) result.push({ type: 'text', text: textBefore });

        // Add ruby
        const base = match[1].replace(/<[^>]+>/g, '').trim();
        const furigana = match[2].replace(/<[^>]+>/g, '').trim();
        if (base) result.push({ type: 'ruby', base, furigana });

        lastIndex = rubyRegex.lastIndex;
    }

    // Add any remaining text after last ruby
    const remainingText = html.slice(lastIndex).replace(/<[^>]+>/g, '').trim();
    if (remainingText) result.push({ type: 'text', text: remainingText });

    return result;
}

function mapSubtitlePartsToSegments(subtitleParts) {
    return subtitleParts.flatMap(part => {
        if (part.type === "ruby") {
            return [{ segment: part.base, reading: part.furigana }];
        } else {
            return [...new Intl.Segmenter('ja-JP', { granularity: 'word' }).segment(part.text)]
                .map(s => ({ segment: s.segment, reading: null }));
        }
    });
}

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
                        // Parse structured parts from innerHTML (ruby + text)
                        const subtitleParts = extractSubtitleWithFurigana(container);

                        // Get subtitle text from container
                        lastSub = subtitleParts.map(p => p.type === 'ruby' ? p.base : p.text).join('');

                        // Map parts to segments (ruby bases whole, plain text segmented)
                        const mappedSegments = mapSubtitlePartsToSegments(subtitleParts);

                        // Send segments to background / known-list
                        chrome.runtime.sendMessage(
                            { action: "known-list", wordList: mappedSegments.map(m => m.segment) },
                            (res) => {
                                overlay.innerHTML = mappedSegments.map((m, index) => {
                                    const { segment, reading } = m;
                                    const knownClass = res && res[index] ? "known" : "";

                                    if (segment.match(japanesePunctuation)) return `<span>${segment}</span>`;
                                    if (reading) return `<span class="segment-word ${knownClass}" data-word="${segment}"><ruby>${segment}<rt>${reading}</rt></ruby></span>`;
                                    return `<span class="segment-word ${knownClass}" data-word="${segment}">${segment}</span>`;
                                }).join('');

                                // Add focus/blur listeners for popup
                                document.querySelectorAll('.segment-word').forEach((span, i) => {
                                    span.tabIndex = 0;
                                    // Add furigana as a second parameter if there is and else ""
                                    const additionalReading = mappedSegments[i] && mappedSegments[i].reading ? mappedSegments[i].reading : "";
                                    span.addEventListener('focus', (e) => showPopup(e, lastSub, additionalReading));
                                    span.addEventListener('blur', hidePopup);
                                });
                            }
                        );

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
