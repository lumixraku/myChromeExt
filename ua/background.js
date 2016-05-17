var urls = []; //UA用
var requestFilter = {
    urls: getUrlForFilter()
};
var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
var bodyWidth = 360;



//插件运行  从localstorage中取url
(function refreshTabListener() {
    //change body 用
    //传给content  每当一个tab upload时  传入url
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
            chrome.tabs.sendMessage(tabId, {
                'url': (function(){
                    var url = localStorage.getItem('url');
                    if(/^https?:\/\/(.*)/.test(url)){
                        rs = url.match(/^https?:\/\/(.*)/);
                        return rs[1];
                    }else{
                        return url;
                    }
                })()
            }, function() {});
        }
    });
})();

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
    }

});

function getUrlForFilter(){
    var url = localStorage.getItem('url');
    var rs = [];
    var arr = [];
    if(/^https?:\/\/(.*)/.test(url)){
        rs = url.match(/^https?:\/\/(.*)/);
        if(rs[1]){
            rs[1] += "/*";
            // if(rs[1][rs[1].length - 1] === '/'){
            //     rs[1] += "*";
            // }else{
            //     rs[1] += '/*';
            // }
            arr[0] = '*://*.' + rs[1];
        }
    }
    console.log(arr[0]);
    return arr;
}


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
// chrome.webRequest.onHeadersReceived.addListener(function(details) {
//     details.responseHeaders.push({
//         'X-Frame-Options': 'sameorigin'
//     });
//     // console.log(details.responseHeaders, details);
// }, {
//     urls: ['<all_urls>']
// }, ['responseHeaders', 'blocking']);
