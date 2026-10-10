'use strict';

var content_scripts = new TestSet()
    .require('[Content Script] {Internet connection required}', () => {
        return withTestTab('https://ya.ru/', async tab => {
            const response = await callChrome(chrome.tabs, 'sendMessage', tab.id, { data: 'msg' });
            if (!response || response.data !== 'response') {
                throw new Error('Content script response did not match.');
            }
            return '';
        });
    }, { timeout: 20000 });
