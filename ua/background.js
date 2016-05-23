var urls = []; //UA用
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
var requestFilter = {
    urls: getUrlForFilter()
};
var bodyWidth = 360;

function getUrlForFilter() {
    var url = localStorage.getItem('url');
    var rs = [];
    var arr = [];
    if (/^https?:\/\/(.*)/.test(url)) {
        rs = url.match(/^https?:\/\/(.*)/);
        if (rs[1]) {
            arr.push('*://*.' + rs[1] + '/*');
        }
    }
    console.log(arr[0]);
    return arr;
}

//插件运行  从localstorage中取url
//change body 用
//传给content  每当一个tab upload时  传入url
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, {
            'url': (function() {
                var url = localStorage.getItem('url');
                if (/^https?:\/\/(.*)/.test(url)) {
                    rs = url.match(/^https?:\/\/(.*)/);
                    return rs[1];
                } else {
                    return url;
                }
            })()
        }, function() {});
    }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!sender.tab) {
        if (message.from === 'popup_save') {
            // 响应从popup 保存的请求
            chrome.webRequest.onBeforeSendHeaders.removeListener(changeUA, requestFilter, ['requestHeaders', 'blocking']);
            chrome.webRequest.onBeforeSendHeaders.addListener(changeUA, {
                urls: getUrlForFilter()
            }, ['requestHeaders', 'blocking']);

            //打开新 tab
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function(tabs) {
                // 打开新tab
                chrome.tabs.create({
                    index: tabs[tabs.length - 1].index + 1,
                    url: localStorage.getItem('url'),
                    active: true
                }, function(tab) {

                });
            });
        }
    } else {
        //controller 有一个获取cookies 的请求
        if (message.from === 'controller') {
            chrome.cookies.getAll({
                url: message.url
            }, function(cookies) {
                var i, len, cookie,
                    cookieStr = '';
                for (i = 0, len = cookies.length; i < len; i += 1) {
                    cookie = cookies[i];
                    cookieStr += cookie.name + '=' + cookie.value + '; ';
                }
                sendResponse(cookieStr);
            });
            return true;//async send messae should return true
            //http://pymaster.logdown.com/post/176203-chrome-extension-under-the-context-of-the-onmessage-asynchronous-sendresponse
        }

    }
});


//拦截请求  并修改UA  打开chrome
chrome.webRequest.onBeforeSendHeaders.addListener(changeUA, requestFilter, ['requestHeaders', 'blocking']);

function changeUA(details) {
    var headers = details.requestHeaders;
    for (var i = 0, l = headers.length; i < l; ++i) {
        if (headers[i].name == 'User-Agent') {
            break;
        }
    }
    if (i < headers.length) {
        headers[i].value = localStorage['user-agent'] || UA;
    }
    return {
        requestHeaders: headers
    };
}

//拦截响应 并修改xframe
// chrome.webRequest.onHeadersReceived.addListener(function(details) {
//     details.responseHeaders.push({
//         'X-Frame-Options': 'sameorigin'
//     });
//     // console.log(details.responseHeaders, details);
// }, {
//     urls: ['<all_urls>']
// }, ['responseHeaders', 'blocking']);
