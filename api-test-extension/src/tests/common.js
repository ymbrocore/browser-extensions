'use strict';

const ITEM_COLOR_SUCCESS = "#dff0d8";
const ITEM_COLOR_FAIL = "#f2dede";
const TITLE_COLOR_SUCCESS = "#5cb85c";
const TITLE_COLOR_FAIL = "#d9534f";

let reportTabId;

function callChrome(obj, method, ...args) {
    return new Promise((resolve, reject) => {
        if (!obj || typeof obj[method] !== 'function') {
            reject(new Error(`API method ${method} is unavailable.`));
            return;
        }
        const originalCallback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
        const callback = (...values) => {
            const error = chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }
            try {
                if (originalCallback) originalCallback(...values);
                resolve(values[0]);
            } catch (error) {
                reject(error);
            }
        };
        try {
            const result = obj[method](...args, callback);
            if (result && typeof result.then === 'function') result.then(resolve, reject);
        } catch (error) {
            reject(error);
        }
    });
}

function sendTestMessage(target, type, data = {}) {
    return callChrome(chrome.runtime, 'sendMessage', Object.assign({}, data, { target, type }))
        .then(response => {
            if (!response) throw new Error(`No response from ${target}.`);
            if (response.error) throw new Error(response.error);
            return response;
        });
}

function waitForTabComplete(tabId) {
    return new Promise((resolve, reject) => {
        let timer;
        const finish = error => {
            clearTimeout(timer);
            chrome.tabs.onUpdated.removeListener(listener);
            if (error) reject(error);
            else resolve();
        };
        const listener = (id, info) => {
            if (id === tabId && info.status === 'complete') finish();
        };
        chrome.tabs.onUpdated.addListener(listener);
        timer = setTimeout(() => finish(new Error('Tab did not finish loading within 15 seconds.')), 15000);
        callChrome(chrome.tabs, 'get', tabId).then(tab => {
            if (tab.status === 'complete') finish();
        }, finish);
    });
}

async function withTestTab(url, test) {
    const tab = await callChrome(chrome.tabs, 'create', { url, active: false });
    try {
        await waitForTabComplete(tab.id);
        return await test(tab);
    } finally {
        await callChrome(chrome.tabs, 'remove', tab.id);
    }
}

function methodExists(obj, method) {
    return () => {
        if (obj != null && Object.prototype.hasOwnProperty.call(obj, method)) {
            return '';
        } else {
            return "Method not found.";
        }
    };
}

function methodCall(obj, method, ...args) {
    return () => {
        if (typeof args[args.length - 1] === 'function') {
            return callChrome(obj, method, ...args).then(() => '');
        }
        try {
            return Promise.resolve(obj[method](...args)).then(() => '');
        } catch(e) {
            return Promise.reject(e);
        }
    };
}

function expectMethodError(obj, method, pattern, ...args) {
    return async () => {
        if (!obj || typeof obj[method] !== 'function') throw new Error(`API method ${method} is unavailable.`);
        try {
            await methodCall(obj, method, ...args)();
        } catch (error) {
            if (!pattern.test(String(error))) throw error;
            return '';
        }
        throw new Error(`${method} unexpectedly accepted invalid input.`);
    };
}

function eventExists(obj, method) {
    return () => {
        if (!obj || !Object.prototype.hasOwnProperty.call(obj, method) || !obj[method]) {
            return "Event not found.";
        }

        if (!obj[method].hasOwnProperty('addListener')
            && !(typeof obj[method].addListener == 'function')) {
            return "Event found but addListener doesn't exists.";
        }

        if (!obj[method].hasOwnProperty('removeListener')
            && !(typeof obj[method].removeListener == 'function')) {
            return "Event found but removeListener doesn't exists.";
        }

        return '';
    }
}

function eventUse(obj, method) {
    return () => {
        let listener = function () {};

        try {
            obj[method].addListener(listener);
        } catch(e) {
            return "Exception occurred during attempt to add a listener";
        }

        try {
            obj[method].removeListener(listener);
        } catch(e) {
            return "Exception occurred during attempt to remove a listener";
        }

        return '';
    };
}

function doneManualTest(id) {
    let $t = $('#' + id);
    $t.html($t.html()
        .replace("Not done yet", "OK")
        .replace(new RegExp("Failed.*"), "OK"));
    $t.css('background-color', ITEM_COLOR_SUCCESS).attr('data-status', "done");

    let list_done = Array.from(
        $t.parent().children().filter('.manual-test-item')
    ).every(elem => {
        return $(elem).attr('data-status') == "done";
    });

    if (list_done) {
        $t.parent().hide('fast')
            .prev().css('background-color', TITLE_COLOR_SUCCESS);

    }
}

function failManualTest(id, reason) {
    let $t = $('#' + id);
    reason = (reason ? ` (${reason})` : "");

    $t.html($t.html()
        .replace("Not done yet", "Failed" + reason)
        .replace("OK", "Failed" + reason));
    $t.css('background-color', ITEM_COLOR_FAIL).attr('data-status', "fail");

    $t.parent().show('fast')
        .prev().css('background-color', TITLE_COLOR_FAIL);
}
