function routeToPath(currentPath) {
    if (window.location.origin == "https://www.netflix.com" && currentPath.startsWith('/watch')) {
        console.log("Entered a Netflix watch page.");
        setupNetflixObserver(); // Function to execute when entering a watch page
    }
    else if (window.location.origin == "https://www.youtube.com" && currentPath.startsWith('/watch')) {
        console.log("Entered a Youtube watch page")
        setupYoutubeObserver();
    }
    else {
        console.log("Not in the watch page.");
        disableNetflixSubs();
    }
}

function setPathObserver() {
    let currentPath = null;

    chrome.storage.local.get("areMiningSubtitlesEnabled", (result) => {
        let areSubsEnabled = result.areMiningSubtitlesEnabled;

        const onDomChange = () => {
            chrome.storage.local.get("areMiningSubtitlesEnabled", (result) => {
                if (chrome.runtime.lastError) {
                    console.error("Context invalidated", chrome.runtime.lastError.message);
                    return;
                }

                const res = result.areMiningSubtitlesEnabled;
                if (res && (currentPath !== window.location.pathname || areSubsEnabled !== res)) {
                    areSubsEnabled = true;
                    currentPath = window.location.pathname;
                    routeToPath(currentPath);
                }
            });
        };

        // Observe changes in the body element
        const observer = new MutationObserver(onDomChange);
        observer.observe(document.body, { childList: true, subtree: true });

        console.log("Path observer initialized.");
        createExtensionButtons()
        onDomChange();

        window.addEventListener("unload", () => {
            observer.disconnect();
        });
    });
}

window.addEventListener('load', () => {
    waitForStorage(() => {
        setPathObserver();
    })
});
