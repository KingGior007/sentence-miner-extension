let open = indexedDB.open("known-words", 3);
open.onupgradeneeded = (e) => {
    let db = e.target.result;
    let objectStore = db.createObjectStore("words", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("word-index", "word", { unique: true });
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "manual-segmentation",
        title: "Create word: \"%s\"",
        contexts: ["selection"],
        documentUrlPatterns: [
            "*://*.netflix.com/watch*",
            "*://*.youtube.com/watch*"
        ]
    }
    );
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "manual-segmentation") {
        chrome.tabs.sendMessage(tab.id, { word: info.selectionText })
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "add-known-word":
            // Takes in .word
            addKnownWord();
            break;
        case "known-list":
            // Takes in .wordList
            knownList(sendResponse);
            return true;
        case "add-known-words":
            // Takes in .wordList
            addKnownWords();
            break;
        default:
            console.log("Invalid action");
    }

    function addKnownWord() {
        let open = indexedDB.open("known-words", 3);

        open.onsuccess = (e) => {
            let db = e.target.result;
            let store = db.transaction("words", "readwrite").objectStore("words");

            let req = store.index("word-index").get(message.word);
            req.onsuccess = function() {
                if (req.result !== undefined) {
                    console.log("Already found");
                    return;
                }

                let request = store.add({ word: message.word, known: true });
                request.onsuccess = () => {
                    console.log(request.result);
                }
            };
        }
    }

    function knownList(sendResponse) {
        let open = indexedDB.open("known-words", 3);
        let knownList = [];
        console.log(message.wordList);

        open.onsuccess = (e) => {
            let db = e.target.result;

            console.log(message.wordList);
            let pending = message.wordList.length;
            message.wordList.forEach((word) => {
                console.log(word);
                let store = db.transaction("words", "readonly").objectStore("words");
                let request = store.index("word-index").get(word);
                request.onsuccess = () => {
                    console.log(request.result !== undefined);
                    knownList.push(request.result !== undefined);
                    pending--;

                    if (pending === 0) {
                        console.log(knownList);
                        sendResponse(knownList);
                    }
                }
            });

            console.log(knownList);
            return knownList;
        }
    }

    function addKnownWords() {
        let open = indexedDB.open("known-words", 3);

        open.onsuccess = (e) => {
            let db = e.target.result;

            console.log(message.wordList)
            message.wordList.forEach((word) => {
                let store = db.transaction("words", "readwrite").objectStore("words");
                let req = store.index("word-index").get(word);

                req.onsuccess = function() {
                    if (req.result !== undefined) {
                        console.log("Already found");
                        return;
                    }

                    console.log(word)
                    const result = store.add({ word: word, known: true });
                }
            });
        }
    }
})

