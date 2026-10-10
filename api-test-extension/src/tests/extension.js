'use strict';

let lastWorkerInstanceId;

const extension_test = new TestSet()
    .require('[Method Exists] runtime', methodExists(chrome, 'runtime'), { hideOnSuccess: true })
    .require('[Method Exists] runtime.getURL', methodExists(chrome.runtime, 'getURL'), { hideOnSuccess: true })
    .require('[Check runtime.getURL]', () => {
        return chrome.runtime.getURL('/') === `chrome-extension://${chrome.runtime.id}/`
            ? '' : 'Incorrect extension URL.';
    })
    .require('[Method Exists] getViews', methodExists(chrome.extension, 'getViews'), { hideOnSuccess: true })
    .require('[Check getViews]', () => {
        const views = chrome.extension.getViews();
        return views.some(view => view === window) ? '' : 'Report page is missing from extension views.';
    })
    .skip('[MV2] getBackgroundPage and background DOM', 'Manifest V3 uses a service worker without a DOM.')
    .skip('[MV2] sendRequest, onRequest and onRequestExternal', 'Replaced by runtime messaging tests.')
    .skip('[MV2] getExtensionTabs', 'Use extension.getViews or tabs.query.')
    .require('[Method Exists] runtime.sendMessage', methodExists(chrome.runtime, 'sendMessage'),
        { hideOnSuccess: true })
    .require('[Event Exists] runtime.onMessage', eventExists(chrome.runtime, 'onMessage'),
        { hideOnSuccess: true })
    .require('[Service worker responds]', async () => {
        const response = await sendTestMessage('worker', 'ping');
        if (response.source !== 'worker' || typeof response.instanceId !== 'string') {
            throw new Error('Unexpected service worker response.');
        }
        lastWorkerInstanceId = response.instanceId;
        return '';
    })
    .require('[Check isAllowedIncognitoAccess]', async () => {
        const allowed = await callChrome(chrome.extension, 'isAllowedIncognitoAccess');
        if (typeof allowed !== 'boolean') throw new Error('Incognito access flag is not a boolean.');
        return '';
    })
    .require('[Check isAllowedFileSchemeAccess]', async () => {
        const allowed = await callChrome(chrome.extension, 'isAllowedFileSchemeAccess');
        if (typeof allowed !== 'boolean') throw new Error('File access flag is not a boolean.');
        return '';
    })
    .require('[Method Exists] setUpdateUrlData', methodExists(chrome.extension, 'setUpdateUrlData'),
        { hideOnSuccess: true })
    .require('[Method Call] setUpdateUrlData', methodCall(chrome.extension, 'setUpdateUrlData', ''))
    .manual('worker-restart-test', 'Stop this extension worker on chrome://serviceworker-internals ' +
        '(or browser://serviceworker-internals), then return here and click ' +
        "<button id='worker-restart-button' class='button-blue'>Ping restarted worker</button>")
    .report_ready(() => {
        $('#worker-restart-button').click(async () => {
            try {
                const response = await sendTestMessage('worker', 'ping');
                if (!lastWorkerInstanceId) throw new Error('Initial worker check did not pass.');
                if (response.source !== 'worker' || response.instanceId === lastWorkerInstanceId) {
                    throw new Error('Worker has not restarted. Stop it before this check.');
                }
                doneManualTest('worker-restart-test');
                lastWorkerInstanceId = response.instanceId;
            } catch (error) {
                failManualTest('worker-restart-test', error.message);
            }
        });
    });
