var doc = document;
var storeValue = localStorage.getItem('url');
var saveBtn = doc.querySelector('.input-button');
var input = doc.querySelector('.input-url');
var msg = doc.querySelector('.msg');
document.addEventListener('DOMContentLoaded', function(e) {
    if (storeValue) {
        input.value = storeValue;
    }
    input.addEventListener('keydown', function(e){
        if(e.keyCode === 13){
            saveHandler();
        }
    });
    saveBtn.addEventListener('click', saveHandler);

    function saveHandler(){
        var value = input.value;
        if( value !== '' &&  !/^https?:\/\/.*/.test(value)){
            value = 'http://' + value;
        }
        localStorage.setItem('url', value);
        chrome.storage.sync.set({ 'url': value }, function() {
            if(input.value !== ''){
                msg.innerHTML = '设置成功 请刷新页面';
            }
        });
        sendToBG(value);
        // sendToContent(value);
    }

}, false);



function sendToBG(value){
    chrome.runtime.sendMessage({url : value, from: 'popup_save'}, function(response) {
    });
}

function sendToContent(value) {
    value = value || '';
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        var tab = tabs[0];
        console.log(tab);
        chrome.tabs.sendMessage(tab.id, { 'url': value }, function() {
            //document.querySelector('#applyCssMsg').innerHTML = response;
        });
    });
}
