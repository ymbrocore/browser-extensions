'use strict';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.target !== 'report' || message.tabId !== reportTabId ||
        message.type !== 'context-menu-click') return;
    doneManualTest('context_menu_click');
    sendResponse({ source: 'report' });
});

var context_menus_test = new TestSet()
    .require('[Method Exists] contextMenus', methodExists(chrome, 'contextMenus'), { hideOnSuccess: true })
    .require('[Method Exists] create', methodExists(chrome.contextMenus, 'create'), { hideOnSuccess: true })
    .require('[Method Exists] update', methodExists(chrome.contextMenus, 'update'), { hideOnSuccess: true })
    .require('[Method Exists] remove', methodExists(chrome.contextMenus, 'remove'), { hideOnSuccess: true })
    .require('[Method Exists] removeAll', methodExists(chrome.contextMenus, 'removeAll'), { hideOnSuccess: true })
    .require('[Event Exists] onClicked', eventExists(chrome.contextMenus, 'onClicked'), { hideOnSuccess: true })
    .require('[Create-Update-Remove]', async () => {
        await callChrome(chrome.contextMenus, 'removeAll');
        try {
            await callChrome(chrome.contextMenus, 'create', { id: 'menu_test', title: 'Context Menu Test' });
            await callChrome(chrome.contextMenus, 'update', 'menu_test', { title: 'Updated Test' });
            await callChrome(chrome.contextMenus, 'remove', 'menu_test');
        } finally {
            await callChrome(chrome.contextMenus, 'removeAll');
        }
        await callChrome(chrome.contextMenus, 'create', {
            id: 'context_test',
            title: '[Click Me]',
            contexts: ['link']
        });
        return '';
    })
    .manual('context_menu_click', 'Long tap or right click ' +
        "<a href='#context_test'>this link</a> and choose this extension's [Click Me] menu item");
