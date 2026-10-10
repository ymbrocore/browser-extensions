'use strict';

var downloads_test = new TestSet()
    .require("[Method Exists] downloads", methodExists(chrome, 'downloads'), { hideOnSuccess: true })

    .require("[Method Exists] download", methodExists(chrome.downloads, 'download'), { hideOnSuccess: true })
    .require('[Invalid URL rejected] download', expectMethodError(chrome.downloads, 'download', /invalid URL/i, {url: ""}, () => {}))

    .require("[Method Exists] search", methodExists(chrome.downloads, 'search'), { hideOnSuccess: true })
    .require("[Method Call] search", methodCall(chrome.downloads, 'search', {}, () => {}))

    .require("[Method Exists] pause", methodExists(chrome.downloads, 'pause'), { hideOnSuccess: true })
    .require('[Invalid download id rejected] pause', expectMethodError(chrome.downloads, 'pause', /Invalid downloadId|Value must be at least 0/i, -1, () => {}))

    .require("[Method Exists] resume", methodExists(chrome.downloads, 'resume'), { hideOnSuccess: true })
    .require('[Invalid download id rejected] resume', expectMethodError(chrome.downloads, 'resume', /Invalid downloadId|Value must be at least 0/i, -1, () => {}))

    .require("[Method Exists] cancel", methodExists(chrome.downloads, 'cancel'), { hideOnSuccess: true })
    .require("[Method Call] cancel", methodCall(chrome.downloads, 'cancel', 0, () => {}))

    .require("[Method Exists] getFileIcon", methodExists(chrome.downloads, 'getFileIcon'), { hideOnSuccess: true })
    .require('[Invalid download id rejected] getFileIcon', expectMethodError(chrome.downloads, 'getFileIcon', /Invalid downloadId|Value must be at least 0/i, -1, {}, () => {}))

    .require("[Method Exists] open", methodExists(chrome.downloads, 'open'), { hideOnSuccess: true })
    .require('[Invalid download id rejected] open', expectMethodError(chrome.downloads, 'open', /Invalid downloadId|Value must be at least 0/i, -1))

    .require("[Method Exists] show", methodExists(chrome.downloads, 'show'), { hideOnSuccess: true })
    .require("[Method Call] show", methodCall(chrome.downloads, 'show', 0))

    .require("[Method Exists] showDefaultFolder", methodExists(chrome.downloads, 'showDefaultFolder'),
        { hideOnSuccess: true })
    // .require("[Method Call] showDefaultFolder", methodCall(chrome.downloads, 'showDefaultFolder'))

    .require("[Method Exists] erase", methodExists(chrome.downloads, 'erase'), { hideOnSuccess: true })
    .require("[Method Call] erase", methodCall(chrome.downloads, 'erase', {query: [""], limit: 1}, () => {}))

    .require("[Method Exists] removeFile", methodExists(chrome.downloads, 'removeFile'), { hideOnSuccess: true })
    .require('[Invalid download id rejected] removeFile', expectMethodError(chrome.downloads, 'removeFile', /Invalid downloadId|Value must be at least 0/i, -1, () => {}))

    .require("[Method Exists] acceptDanger", methodExists(chrome.downloads, 'acceptDanger'), { hideOnSuccess: true })
    .require('[Invalid download id rejected] acceptDanger', expectMethodError(chrome.downloads, 'acceptDanger', /Invalid downloadId|Value must be at least 0/i, -1, () => {}))

    .skip('[Legacy] downloads.drag', 'Not part of the current Chrome downloads API.')

    .require("[Method Exists] setShelfEnabled", methodExists(chrome.downloads, 'setShelfEnabled'),
        { hideOnSuccess: true })
    .require("[Method Call] setShelfEnabled", methodCall(chrome.downloads, 'setShelfEnabled', false))

    .require('[Download-Pause-Resume]', async () => {
        const id = await callChrome(chrome.downloads, 'download', {
            url: 'https://yastatic.net/morda-logo/i/bender/logo.svg', saveAs: false
        });
        const item = async () => {
            const items = await callChrome(chrome.downloads, 'search', { id });
            if (!items.length) throw new Error('Download item not found.');
            return items[0];
        };
        try {
            if ((await item()).state === 'complete') {
                return { skip: 'Download completed before pausing. A slower download is required to test pause/resume.' };
            }
            try {
                await callChrome(chrome.downloads, 'pause', id);
            } catch (error) {
                if ((await item()).state !== 'complete') throw error;
                return { skip: 'Download completed before pausing. A slower download is required to test pause/resume.' };
            }
            const paused = await item();
            if (paused.state === 'complete') {
                return { skip: 'Download completed before pause could be observed.' };
            }
            if (paused.state !== 'in_progress' || !paused.paused) throw new Error('Download was not paused.');
            await callChrome(chrome.downloads, 'resume', id);
            const resumed = await item();
            if (resumed.paused || !['in_progress', 'complete'].includes(resumed.state)) {
                throw new Error('Download was not resumed.');
            }
            return '';
        } finally {
            await callChrome(chrome.downloads, 'cancel', id).catch(() => {});
            await callChrome(chrome.downloads, 'removeFile', id).catch(() => {});
            await callChrome(chrome.downloads, 'erase', { id });
        }
    }, { timeout: 15000 });
