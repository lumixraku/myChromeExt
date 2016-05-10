var requestFilter = {
	// urls: [
	// 	"<all_urls>"
	// ]
	urls: [
		//"*://github.com/*", //url通配符,
		//"*://baidu.com/*"
		"http://ad.toutiao.com/tetris/page/6479032665"
	]
};

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
	var headers = details.requestHeaders;
	if( !localStorage['user-agent'] ) {
		return;
	}
	for(var i = 0, l = headers.length; i < l; ++i) {
		if( headers[i].name == 'User-Agent' ) {
			break;
		}
	}
	if(i < headers.length) {
		headers[i].value = localStorage['user-agent'];
	}
	return {requestHeaders: headers};
}, requestFilter, ['requestHeaders','blocking']);



function mountMsgListener() {
    //响应Popup Tab 发来的消息

}
mountMsgListener();