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
