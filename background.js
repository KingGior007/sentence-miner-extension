chrome.runtime.onInstalled.addListener(function() {
	chrome.contextMenus.create({
		id: "manual-segmentation",
		title: "Create word: \"%s\"",
		contexts: ["selection"]
	});
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "manual-segmentation") {
		console.log(info.selectionText);
		chrome.tabs.sendMessage(tab.id, { word: info.selectionText })
	}
});

