'use strict';

async function runPopupTest() {
    const reportUrl = chrome.runtime.getURL('src/browser_action/browser_action.html');
    const [tab] = await callChrome(chrome.tabs, 'query', {
        active: true,
        currentWindow: true
    });
    if (!tab) throw new Error('No active tab found.');

    if (tab.url !== reportUrl) {
        await callChrome(chrome.tabs, 'update', tab.id, { url: reportUrl });
        return;
    }

    const responses = new Set(['report', 'worker']);
    const replies = await Promise.all([
        sendTestMessage('report', 'ping', { tabId: tab.id }),
        sendTestMessage('worker', 'ping')
    ]);
    for (const response of replies) {
        if (!response || !responses.has(response.source)) {
            throw new Error('Unexpected or duplicate response to popup.');
        }
        responses.delete(response.source);
    }
    if (responses.size) throw new Error('A popup response is missing.');

    const relay = await sendTestMessage('worker', 'relay', { tabId: tab.id });
    if (relay.source !== 'worker' || !relay.relayed || relay.relayed.source !== 'report') {
        throw new Error('Worker could not exchange messages with the report.');
    }
    await sendTestMessage('report', 'popup-result', { tabId: tab.id, ok: true });
    $('h3').text('Messages OK. Close and reopen to repeat.');
}

$(() => {
    runPopupTest().catch(async error => {
        $('h3').text(`Failed: ${error.message}`);
        try {
            const [tab] = await callChrome(chrome.tabs, 'query', {
                active: true, currentWindow: true
            });
            if (tab) {
                await sendTestMessage('report', 'popup-result', {
                    tabId: tab.id, ok: false, error: error.message
                });
            }
        } catch (reportError) {
            console.error(reportError);
        }
    });
});
