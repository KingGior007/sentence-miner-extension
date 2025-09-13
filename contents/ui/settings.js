function enableSettings() {
    const sidebar = document.createElement('div');
    sidebar.classList.add('sidebar');
    document.body.appendChild(sidebar);

    const loadAnki = document.createElement('button');
    loadAnki.textContent = "Load from anki";
    loadAnki.classList.add('sidebarButton');
    sidebar.appendChild(loadAnki);
    loadAnki.addEventListener("click", () => {
        fetch("http://localhost:5123/get_known_core_words", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                deck: "Core 2k/6k Optimized Japanese Vocabulary",
                wordField: "Vocabulary-Kanji"
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                chrome.runtime.sendMessage({ action: "add-known-words", wordList: data.words });
            })
            .catch(error => console.error("Error:", error));
    })
}

function createExtensionButtons() {
    // Create a container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('extension-button-container');

    // Create the "Turn On/Off" button
    const toggleButton = document.createElement('button');
    chrome.storage.local.get("areMiningSubtitlesEnabled", (result) => {
        if (result.areMiningSubtitlesEnabLed === true) {
            toggleButton.textContent = 'Turn Off';
        }
        else if (result.areMiningSubtitlesEnabled === false) {
            toggleButton.textContent = 'Turn On';
        }
        else {
            toggleButton.textContent = 'Error';
        }
    })
    toggleButton.classList.add('extension-button', 'toggle-button');

    // Add click event to "Turn On/Off" button
    toggleButton.addEventListener('click', () => {
        chrome.storage.local.get("areMiningSubtitlesEnabled", (result) => {
            if (result.areMiningSubtitlesEnabled === true) {
                disableNetflixSubs();
                chrome.storage.local.set({ areMiningSubtitlesEnabled: false });
                toggleButton.textContent = 'Turn On';
            }
            else if (result.areMiningSubtitlesEnabled === false) {
                chrome.storage.local.set({ areMiningSubtitlesEnabled: true });
                // TODO: I believe I need to now make this open them
                toggleButton.textContent = 'Turn Off';
            }
            else {
                toggleButton.textContent = 'Error';
            }
        })
    });

    // Create the "Settings" button
    const settingsButton = document.createElement('button');
    settingsButton.textContent = 'Settings';
    settingsButton.classList.add('extension-button', 'settings-button');
    settingsButton.addEventListener("click", () => {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) {
            enableSettings()
        }
        else {
            sidebar.remove()
        }
    })

    // Append buttons to the container
    buttonContainer.appendChild(toggleButton);
    buttonContainer.appendChild(settingsButton);

    // Append the container to the body
    document.body.appendChild(buttonContainer);
}
