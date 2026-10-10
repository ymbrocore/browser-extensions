'use strict';

let root = {
    onBeforeRequest: {
        onBeforeSendHeaders: {
            onSendHeaders: {
                onHeadersReceived: {
                    onAuthRequired: {
                        onBeforeSendHeaders: null
                    },
                    onBeforeRedirect: null,
                    onResponseStarted: {
                        onCompleted: { term: true },
                        onErrorOccurred: { term: true }
                    },
                    onErrorOccurred: { term: true }
                },
                onErrorOccurred: { term: true }
            },
            onErrorOccurred: { term: true }
        },
        onBeforeRedirect: null,
        onResponseStarted: null,
        onErrorOccurred: { term: true }
    }
};

root.onBeforeRequest.onBeforeSendHeaders.onSendHeaders.onHeadersReceived.onAuthRequired.onBeforeSendHeaders =
    root.onBeforeRequest.onBeforeSendHeaders;

root.onBeforeRequest.onBeforeSendHeaders.onSendHeaders.onHeadersReceived.onBeforeRedirect =
    root;

root.onBeforeRequest.onBeforeRedirect =
    root.onBeforeRequest.onBeforeSendHeaders.onSendHeaders.onHeadersReceived.onBeforeRedirect;

root.onBeforeRequest.onResponseStarted =
    root.onBeforeRequest.onBeforeSendHeaders.onSendHeaders.onHeadersReceived.onResponseStarted;

var web_request_test = new TestSet()
    .require("[webRequest life cycle check]", () => new Promise((resolve, reject) => {
        let node = root;
        let query = Date.now();
        let requestId = undefined;
        let curName = 'root';
        let tabID = undefined;
        let finished = false;
        let timer;
        const listeners = [];
        const finish = error => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            for (const [event, listener] of listeners) event.removeListener(listener);
            if (tabID !== undefined) callChrome(chrome.tabs, 'remove', tabID).catch(console.error);
            if (error) reject(error);
            else resolve('');
        };

        let get_listener = (name) => {
            return function (details) {
                if (finished) return;
                if (requestId === undefined && name === 'onBeforeRequest' &&
                    details.url.includes(`api_test=${query}`)) requestId = details.requestId;
                if (requestId === undefined || requestId !== details.requestId) return;
                if (name === 'onErrorOccurred') {
                    finish(new Error(`Test request failed: ${details.error}`));
                    return;
                }
                if (node[name] !== undefined) {
                    if (node[name].term === true) {
                        finish();
                        return;
                    }

                    node = node[name];
                    curName = name;
                } else {
                    finish(new Error(`Request with ID:${requestId} has violated request life cycle, ` +
                           `unexpected transition from ${curName} to ${name} occurred`));
                }
            };
        };

        try {
            for (let name of ['onBeforeRequest', 'onBeforeSendHeaders', 'onSendHeaders', 'onHeadersReceived',
                              'onAuthRequired', 'onBeforeRedirect', 'onResponseStarted', 'onCompleted',
                              'onErrorOccurred']) {
                const event = chrome.webRequest[name];
                const listener = get_listener(name);
                event.addListener(listener, {
                    urls: ['http://ya.ru/*', 'https://ya.ru/*'], types: ['main_frame']
                });
                listeners.push([event, listener]);
            }
            timer = setTimeout(() => finish(new Error('Test request did not complete within 15 seconds.')), 15000);
            callChrome(chrome.tabs, 'create', {
                url: `https://ya.ru/?api_test=${query}`, active: false
            }).then(tab => {
                tabID = tab.id;
                if (finished) callChrome(chrome.tabs, 'remove', tabID).catch(console.error);
            }, finish);
        } catch (error) {
            finish(error);
        }
    }), { async: true, timeout: 20000 });
