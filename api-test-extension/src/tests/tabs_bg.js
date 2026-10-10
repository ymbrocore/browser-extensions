let msg = { data: "msg" };

chrome.runtime.onConnect.addListener(port => {
    if (port.name !== 'api-test') return;
    port.onMessage.addListener(message => {
        if (message.data === 'msg') port.postMessage({ data: 'response' });
    });
});
let res = { data: "response" };

let listener = function (response, sender, sendResponse) {
    if (response.data === msg.data) {
        sendResponse(res);
        chrome.runtime.onMessage.removeListener(listener);
    } else {
        sendResponse(true);
    }
};

chrome.runtime.onMessage.addListener(listener);
