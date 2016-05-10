document.addEventListener('DOMContentLoaded', function(e) {
    var doc = document;
    var storeValue = localStorage.getItem('url');
    var saveBtn = doc.querySelector('.button');
    var input = doc.querySelector('.input-url');
    var msg = doc.querySelector('.msg');
    if (storeValue) {
        input.value = storeValue;
    }
    saveBtn.addEventListener('click', function() {
        var value = input.value;
        localStorage.setItem('url', value);
        chrome.storage.sync.set({ 'url': value }, function() {
            // Notify that we saved.
            // message('Settings saved');
            msg.innerHTML = '设置成功 请刷新页面'
        });
        sendToContent(value);
    });
}, false);

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
// sendToContent();