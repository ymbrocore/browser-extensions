'use strict';

var browser_action_test = new TestSet()
    .require('[Method Exists] action', methodExists(chrome, 'action'), { hideOnSuccess: true })
    .require('[Method Exists] setTitle', methodExists(chrome.action, 'setTitle'), { hideOnSuccess: true })
    .require('[Method Call] setTitle', methodCall(chrome.action, 'setTitle', { title: 'Action Test' }, () => {}))
    .require('[Method Exists] getTitle', methodExists(chrome.action, 'getTitle'), { hideOnSuccess: true })
    .require('[Set-Get Title]', async () => {
        const original = await callChrome(chrome.action, 'getTitle', {});
        try {
            await callChrome(chrome.action, 'setTitle', { title: 'Action Test' });
            const title = await callChrome(chrome.action, 'getTitle', {});
            if (title !== 'Action Test') throw new Error('Title did not match.');
            return '';
        } finally {
            await callChrome(chrome.action, 'setTitle', { title: original });
        }
    })
    .require('[Method Exists] setIcon', methodExists(chrome.action, 'setIcon'), { hideOnSuccess: true })
    .require('[Method Call] setIcon',
        methodCall(chrome.action, 'setIcon', { path: chrome.runtime.getURL('icons/icon19.png') }, () => {}))
    .require('[Method Exists] setPopup', methodExists(chrome.action, 'setPopup'), { hideOnSuccess: true })
    .require('[Method Exists] getPopup', methodExists(chrome.action, 'getPopup'), { hideOnSuccess: true })
    .require('[Set-Get Popup]', async () => {
        await callChrome(chrome.action, 'setPopup', { popup: 'src/browser_action/popup.html' });
        const popup = await callChrome(chrome.action, 'getPopup', {});
        if (popup !== chrome.runtime.getURL('src/browser_action/popup.html')) {
            throw new Error('Popup URL did not match.');
        }
        return '';
    });
