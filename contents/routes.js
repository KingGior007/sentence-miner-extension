const extensionState = {
    areMiningSubtitlesEnabled: false
};

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

    const onDomChange = () => {
        const enabled = extensionState.areMiningSubtitlesEnabled;

        if (enabled && currentPath !== window.location.pathname) {
            currentPath = window.location.pathname;
            routeToPath(currentPath);
        }
    };

    const observer = new MutationObserver(onDomChange);
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("Path observer initialized.");

    createExtensionButtons();
    onDomChange();

    window.addEventListener("unload", () => {
        observer.disconnect();
    });
}

function initializeState(callback) {
    chrome.storage.local.get(["areMiningSubtitlesEnabled"], (result) => {
        extensionState.areMiningSubtitlesEnabled =
            result.areMiningSubtitlesEnabled ?? false;

        callback();
    });
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.areMiningSubtitlesEnabled) {
        extensionState.areMiningSubtitlesEnabled =
            changes.areMiningSubtitlesEnabled.newValue;
    }
});

window.addEventListener('load', () => {
    waitForStorage(() => {
        initializeState(() => {
            setPathObserver();
        });
    });
});
