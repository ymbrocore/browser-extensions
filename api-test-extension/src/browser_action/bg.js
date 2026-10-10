'use strict';

const workerInstanceId = `${Date.now()}-${Math.random()}`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== 'worker') return;

    if (message.type === 'ping') {
        sendResponse({ source: 'worker', instanceId: workerInstanceId });
    } else if (message.type === 'relay') {
        chrome.runtime.sendMessage({
            target: 'report',
            type: 'ping',
            tabId: message.tabId
        }, response => {
            const error = chrome.runtime.lastError;
            sendResponse(error
                ? { error: error.message }
                : { source: 'worker', relayed: response });
        });
        return true;
    }
});

if (chrome.contextMenus && chrome.contextMenus.onClicked) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId !== 'context_test' || !tab) return;

        chrome.runtime.sendMessage({
            target: 'report',
            type: 'context-menu-click',
            tabId: tab.id
        }, () => {
            // The report may have been closed before the menu event arrives.
            if (chrome.runtime.lastError) {
                console.debug(chrome.runtime.lastError.message);
            }
        });
    });
}
