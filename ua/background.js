

var urls = []; //UA用
var requestFilter = {
    urls: [localStorage.getItem('url')]
};
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
var bodyWidth = 360;



//插件运行  从localstorage中取url
(function refreshTabListener() {
    //并传给content  每当一个tab upload时  传入url
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status === 'loading') {
            chrome.tabs.sendMessage(tabId, {
                'url': localStorage.getItem('url')
            }, function() {});
        }
        if (changeInfo.status === 'complete') {
            chrome.tabs.sendMessage(tabId, {
                'url': localStorage.getItem('url')
            }, function() {});
        }
    });
})();

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

    if (!sender.tab) {
        if (message.from == 'popup_save') {

            // 响应从popup 保存的请求
            chrome.webRequest.onBeforeSendHeaders.removeListener(changeUA, requestFilter, ['requestHeaders', 'blocking']);
            chrome.webRequest.onBeforeSendHeaders.addListener(changeUA, {
                urls: [localStorage.getItem('url')]
            }, ['requestHeaders', 'blocking']);

            //打开新window
            chrome.windows.create({
                'url': localStorage.getItem('url'),
                'type': 'popup',
                'width': bodyWidth
            }, function(window) {});
        }
    }else{

        //响应 content 传来的消息
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            // 打开新tab
            chrome.tabs.create({
                index: tabs[tabs.length - 1 ].index + 1,
                url: 'performance.html',
                active: true
            }, function(tab) {
                //向新建标签页发送消息要等待标签页创建  //create是异步函数 create木有执行完就会进入回调
                setTimeout(function() {
                    console.log(message);
                    chrome.tabs.sendMessage(tab.id, {from: 'bgToPerf', message: message}, function handler(response) {

                    });
                }, 100);
            });
        });
    }


});



//拦截请求  并修改UA  打开chrome
chrome.webRequest.onBeforeSendHeaders.addListener(changeUA, requestFilter, ['requestHeaders', 'blocking']);


function changeUA(details) {
    // console.log('req 1', localStorage.getItem('url'));
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
chrome.webRequest.onHeadersReceived.addListener(function(details) {
    details.responseHeaders.push({
        'X-Frame-Options': 'sameorigin'
    });
    // console.log(details.responseHeaders, details);
}, {
    urls: ['<all_urls>']
}, ['responseHeaders', 'blocking']);
