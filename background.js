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

