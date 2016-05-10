document.addEventListener('DOMContentLoaded', function(e) {
    var ifr = document.querySelector('#ifr_phone');
    var contentWindow = ifr.contentWindow;
    var contentDoc = contentWindow.document || ifr.contentDocument;
    contentDoc.addEventListener('DOMContentLoaded', function(e){
        var body = contentDoc.body;
        console.log(body);
    }, false);
    ifr.onload = function(){
        var body = contentDoc.body;
        body.onclick = function(e){
            var target = e.target;

        }
    }
}, false);