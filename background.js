let open = indexedDB.open("known-words", 3);
open.onupgradeneeded = (e) => {
        let db = e.target.result;
        db.deleteObjectStore("words");
        let objectStore = db.createObjectStore("words", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("word-index", "word", { unique: true });
}

open.onsuccess = (e) => {
        let db = e.target.result;
        let store = db.transaction("words", "readwrite").objectStore("words");
        let request = store.add({ word: "word1", known: true });
        request.onsuccess = function() {
                console.log(request.result);

                let req = store.index("word-index").get("word1");
                req.onsuccess = function() {
                        console.log(req.result.word);
                        store.clear()
                };
        };
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

chrome.runtime.onMessage.addListener((message) => {
        if (message.action !== "Known-word") {
                console.log("no");
                return;
        }
        else {
                console.log("yes");
        }

        let open = indexedDB.open("known-words", 3);

        open.onsuccess = (e) => {
                let db = e.target.result
                let store = db.transaction("words", "readwrite").objectStore("words");

                let req = store.index("word-index").get(message.word);
                req.onsuccess = function() {
                        console.log(req.result?.word);

                        let request = store.add({ word: message.word, known: true });
                        request.onsuccess = () => {
                                console.log(request.result);
                        }
                };
        }
})

