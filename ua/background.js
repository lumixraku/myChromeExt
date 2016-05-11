// var urls = [
//     "*://github.com/*", //url通配符,
//     "*://baidu.com/*",
//     "http://ad.toutiao.com/tetris/page/6253880211/"
// ]



var urls = []; //UA用
var storeValue = localStorage.getItem('url');
//响应popup中 保存消息 //localstorage被改变
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    storeValue = localStorage.getItem('url');
    urls = [storeValue];
});

//插件运行  从localstorage中取url
function setUrls() {
    // urls.push(localStorage.getItem('urls'));
    if(storeValue){
        urls.push(storeValue);
    }
    //并传给content  每当一个tab upload时  传入url
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
        if(changeInfo.status === 'loading'){
            chrome.tabs.sendMessage(tabId, { 'url': storeValue }, function() {
                //document.querySelector('#applyCssMsg').innerHTML = response;
            });
        }
        if(changeInfo.status === 'complete'){
            chrome.tabs.sendMessage(tabId, { 'url': storeValue }, function() {
                //document.querySelector('#applyCssMsg').innerHTML = response;
            });
        }
    });


}
setUrls();


//拦截请求  并修改UA
(function() {
    var requestFilter = {
        urls: urls
    };
    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
        var headers = details.requestHeaders;
        if (!localStorage['user-agent']) {
            return;
        }
        for (var i = 0, l = headers.length; i < l; ++i) {
            if (headers[i].name == 'User-Agent') {
                break;
            }
        }
        if (i < headers.length) {
            headers[i].value = localStorage['user-agent'];
        }
        return { requestHeaders: headers };
    }, requestFilter, ['requestHeaders', 'blocking']);
})();