var urls = []; //UA用
var requestFilter = {
    urls: [localStorage.getItem('url')]
};
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';

//插件运行  从localstorage中取url
(function refreshTabListener() {
    //并传给content  每当一个tab upload时  传入url
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status === 'loading') {
            chrome.tabs.sendMessage(tabId, { 'url': localStorage.getItem('url') }, function() {
                //document.querySelector('#applyCssMsg').innerHTML = response;
            });
        }
        if (changeInfo.status === 'complete') {
            chrome.tabs.sendMessage(tabId, { 'url': localStorage.getItem('url') }, function() {
                //document.querySelector('#applyCssMsg').innerHTML = response;
            });
        }
    });
})()


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!sender.tab) {
        chrome.webRequest.onBeforeSendHeaders.removeListener(changeUA, requestFilter, ['requestHeaders', 'blocking']);
        chrome.webRequest.onBeforeSendHeaders.addListener(changeUA, {
            urls: [localStorage.getItem('url')]
        }, ['requestHeaders', 'blocking']);
    }
});


//拦截请求  并修改UA  打开chrome
chrome.webRequest.onBeforeSendHeaders.addListener(changeUA, requestFilter, ['requestHeaders', 'blocking']);


function changeUA(details) {
    console.log('req 1', localStorage.getItem('url'));
    var headers = details.requestHeaders;
    for (var i = 0, l = headers.length; i < l; ++i) {
        if (headers[i].name == 'User-Agent') {
            break;
        }
    }
    if (i < headers.length) {
        headers[i].value = localStorage['user-agent'] || UA;
    }
    return { requestHeaders: headers };
}