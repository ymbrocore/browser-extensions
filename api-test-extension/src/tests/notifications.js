'use strict';

var notifications_test = new TestSet()
    .require('[Method Exists] notifications', methodExists(chrome, 'notifications'), { hideOnSuccess: true })
    .require('[Method Exists] create', methodExists(chrome.notifications, 'create'), { hideOnSuccess: true })
    .require('[Method Exists] update', methodExists(chrome.notifications, 'update'), { hideOnSuccess: true })
    .require('[Method Exists] clear', methodExists(chrome.notifications, 'clear'), { hideOnSuccess: true })
    .require('[Create-Update-Clear Notification]', async () => {
        const permission = await callChrome(chrome.notifications, 'getPermissionLevel');
        if (permission !== 'granted') {
            return { skip: `Notifications are not permitted: ${permission}. Enable notifications to run this check.` };
        }
        const id = await callChrome(chrome.notifications, 'create', `api-test-auto-${Date.now()}`, {
            type: 'basic', title: 'API Test', message: 'Notification test',
            iconUrl: chrome.runtime.getURL('icons/icon80.png')
        });
        try {
            const updated = await callChrome(chrome.notifications, 'update', id, { message: 'Updated test' });
            if (!updated) throw new Error('Notification was not updated.');
        } finally {
            await callChrome(chrome.notifications, 'clear', id);
        }
        return '';
    })
    .require('[Method Exists] getAll', methodExists(chrome.notifications, 'getAll'), { hideOnSuccess: true })
    .require('[Method Call] getAll', methodCall(chrome.notifications, 'getAll', () => {}))
    .require('[Method Exists] getPermissionLevel', methodExists(chrome.notifications, 'getPermissionLevel'),
        { hideOnSuccess: true })
    .require('[Method Call] getPermissionLevel', methodCall(chrome.notifications, 'getPermissionLevel', () => {}))
    .manual('notification-test', 'Press Start and click the notification that appears' +
        " <button id='notification-test-button' class='button-blue'>Start</button>")
    .report_ready(() => {
        $('#notification-test-button').click(async () => {
            try {
                const id = await callChrome(chrome.notifications, 'create', 'api-test-manual', {
                    type: 'basic', iconUrl: chrome.runtime.getURL('icons/icon80.png'),
                    title: 'API Test', message: 'Click to complete the notification test'
                });
                const listener = clickedId => {
                    if (clickedId !== id) return;
                    doneManualTest('notification-test');
                    chrome.notifications.onClicked.removeListener(listener);
                    callChrome(chrome.notifications, 'clear', id).catch(console.error);
                };
                chrome.notifications.onClicked.addListener(listener);
            } catch (error) {
                failManualTest('notification-test', error.message);
            }
        });
    });
