'use strict';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== 'report' || message.tabId !== reportTabId) return;

    if (message.type === 'ping') {
        sendResponse({ source: 'report' });
    } else if (message.type === 'popup-result') {
        if (message.ok) {
            doneManualTest('popup-scripts-test');
        } else {
            failManualTest('popup-scripts-test', message.error);
        }
        sendResponse({ source: 'report' });
    }
});

var popup_scripts = new TestSet()
    .require('[Worker responds to repeated messages]', async () => {
        for (let i = 0; i < 2; i++) {
            const response = await sendTestMessage('worker', 'ping');
            if (response.source !== 'worker') throw new Error('Unexpected worker response.');
        }
        return '';
    })
    .manual('popup-scripts-test', 'Open the extension popup, close it and open it again. ' +
        'Each popup must show Messages OK');
