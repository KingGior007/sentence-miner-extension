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
        const overlay = document.querySelector(".custom-overlay");
        const youtubePlayer = document.querySelector("div#player")
        if (!overlay) {
            return;
        }
        if (document.fullscreenElement !== null) {
            document.fullscreenElement.appendChild(overlay);
        }
        else if (window.location.origin == "https://www.netflix.com") {
            document.body.appendChild(overlay);
        }
        else if (window.location.origin == "https://www.youtube.com") {
            youtubePlayer.appendChild(overlay);
        }
    })
}


function disableNetflixSubs() {
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
