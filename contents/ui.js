function addOverlay() {
    if (!document.querySelector(".custom-overlay")) {
        overlay = document.createElement('div');
        overlay.className = 'custom-overlay';
        overlay.textContent = 'Fetching subtitles...';

        overlay.addEventListener('mousedown', (e) => e.stopPropagation());
        overlay.addEventListener('mouseup', (e) => e.stopPropagation());
        overlay.addEventListener('click', (e) => e.stopPropagation());
    }

    const youtubePlayer = document.querySelector("div#player")
    if (youtubePlayer) youtubePlayer.appendChild(overlay)
    else if (!document.contains(overlay)) document.body.appendChild(overlay);

    document.addEventListener("fullscreenchange", () => {
        console.log("fullscreenchange");
        const overlay = document.querySelector(".custom-overlay");
        const youtubePlayer = document.querySelector("div#player")
        fullscreenElement = document.fullscreenElement;
        if (document.fullscreenElement !== null) {
            console.log("fullscreen");
            document.fullscreenElement.appendChild(overlay);
        }
        else if (window.location.origin == "https://www.netflix.com") {
            console.log("net");
            document.body.appendChild(overlay);
        }
        else if (window.location.origin == "https://www.youtube.com") {
            console.log("yt");
            youtubePlayer.appendChild(overlay);
        }
    })
}

async function showPopup(e, lastSub) {
    hidePopup(e);
    const word = e.target.dataset.word;
    const popup = document.createElement('div');
    popup.className = 'dictionary-popup';
    try {
        const { kana, common, glosses } = await getDictionary(word);
        popup.innerHTML = `${kana}<span class="common-tag">${common}</span><span class="anki-button">send to anki</span><br>${glosses.join(", ")}`;
        popup.querySelector(".anki-button").addEventListener("click", (e) => createSentenceCard(word, kana, glosses, lastSub));
    } catch {
        popup.innerHTML = "An error occured while fetching " + word + "'s data"
    }

    if (document.fullscreenElement) {
        document.fullscreenElement.appendChild(popup)
    }
    else if (window.location.origin == "https://www.youtube.com" || window.location.origin == "https://www.netflix.com") {
        document.body.appendChild(popup);
    }

    const rect = e.target.getBoundingClientRect();
    const subs = document.querySelector(".custom-overlay").getBoundingClientRect();
    popup.style.position = 'absolute'; // Ensure it's positioned absolutely
    popup.style.bottom = `${window.innerHeight - subs.top + 10}px`;  // Adjust the '10' for spacing above
    popup.style.left = `${rect.left}px`; // Align horizontally with the word
    popup.addEventListener('mouseleave', (e) => hidePopup(e));

    document.addEventListener("fullscreenchange", () => {
        hidePopup(1)
    })
}

function hidePopup(e) {
    let popups = document.getElementsByClassName('dictionary-popup');
    let allDeleted = true
    for (let popup of popups) {
        if (popup && !popup.matches(':hover')) {
            popup.remove();
        }
        else {
            allDeleted = false;
        }
    }
}

function disableNetflixSubs() {
    chrome.storage.local.set({ areMiningSubtitlesEnabled: false })

    hidePopup();
    const overlays = document.getElementsByClassName('custom-overlay')
    if (overlays) {
        for (let i = 0; i < overlays.length; i++) {
            overlays[i].remove()
        }
    }

    const subContainers = document.querySelectorAll("ytd-engagement-panel-section-list-renderer.style-scope.ytd-watch-flexy");
    for (const subContainer of subContainers) {
        const computedStyle = getComputedStyle(subContainer);
        if (computedStyle.order && Number(computedStyle.order) <= 0 &&
            subContainer.getAttribute("target-id") == "engagement-panel-searchable-transcript") {
            subContainer.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN");
            break;
        }
    }
}

function createExtensionButtons() {
    // Create a container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('extension-button-container');

    // Create the "Turn On/Off" button
    const toggleButton = document.createElement('button');
    chrome.storage.local.get("areMiningSubtitlesEnabled", (result) => {
        if (result.areMiningSubtitlesEnabled === true) {
            toggleButton.textContent = 'Turn Off';
        }
        else {
            toggleButton.textContent = 'Turn On';
        }
    })
    toggleButton.classList.add('extension-button', 'toggle-button');

    // Add click event to "Turn On/Off" button
    toggleButton.addEventListener('click', () => {
        chrome.storage.local.get("areMiningSubtitlesEnabled", (result) => {
            if (result.areMiningSubtitlesEnabled === true) {
                disableNetflixSubs()
                toggleButton.textContent = 'Turn On';
            }
            else {
                chrome.storage.local.set({ areMiningSubtitlesEnabled: true })
                toggleButton.textContent = 'Turn Off';
            }
        })
    });

    // Create the "Settings" button
    const settingsButton = document.createElement('button');
    settingsButton.textContent = 'Settings';
    settingsButton.classList.add('extension-button', 'settings-button');

    // Append buttons to the container
    buttonContainer.appendChild(toggleButton);
    buttonContainer.appendChild(settingsButton);

    // Append the container to the body
    document.body.appendChild(buttonContainer);
}
