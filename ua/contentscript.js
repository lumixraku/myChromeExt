var $body;
var bodyWidth = 360;
var controlWidth = 540;
var $control;
$body = $('body');



chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    //不是tab发来的消息
    if (!sender.tab) {
        console.log(message.url)
        changeBody();
        hover();
        rightClick();
    }
});


function changeBody() {
    $body.css({
        width: bodyWidth,
        float: 'left'
    })
    $control = $('<div>', {
        id: 'control_panel'
    });
    $control.css({
        float: 'left',
        width: controlWidth,
        minHeight: controlWidth
    });
    $body.parent().append($control);
}

function hover(){
    /************************************/
    // enter  leave 是不冒泡的  over out 冒泡
    // $body.on('mouseenter', '*', function(e){
    //     var target = e.target;
    //     // $('.hover-shadow').removeClass('hover-shadow');
    //     target.classList.add('hover-shadow');
    // });
    // //部分leave无法触发
    // $body.on('mouseleave', '*', function(e){
    //     var target = e.target;
    //     target.classList.remove('hover-shadow');
    // });


    $("body *").mouseover(function(e) {
        var target = e.target;
        $(target).addClass("hover-shadow");
        e.stopPropagation();
    });
    $("body *").mouseout(function(e) {
        var target = e.target;
        $(target).removeClass("hover-shadow");
        e.stopPropagation();
    });


    //hover存在冒泡  即使这样也无法完全解决
    // $('body *').hover(function(e){
    //     e.stopPropagation();
    //     var target = e.target;
    //     // $('.hover-shadow').removeClass('hover-shadow');
    //     target.classList.add('hover-shadow');
    // }, function(e){
    //     e.stopPropagation();
    //     var target = e.target;
    //     target.classList.remove('hover-shadow');
    // })

    /************************************/
    // 增加悬浮div 不可取  因为hover时增加的这shadow  同时也触发了hover shadow
    // $hoverShadow = $('<div>', {
    //     class: 'hover-shadow'
    // })
    // $body.append($hoverShadow);
    // var lastTarget;
    // $('body *').hover(function(e) {
    //     var target = e.target;
    //     if (target.classList.contains('hover-shadow') ||target == lastTarget) {
    //         // console.log('eq');
    //         return;
    //     }
    //     console.log(target);
    //     lastTarget = target;
    //     var $target = $(target);
    //     var offset = $target.offset();
    //     var width = target.offsetWidth;
    //     var height = target.offsetHeight;
    //     var left = offset.left;
    //     var top = offset.top;
    //     // console.log('set');
    //     $hoverShadow.css({
    //         left: left,
    //         top: top,
    //         width: width,
    //         height: height
    //     })
    // }, function(e) {
    //     $hoverShadow.css({
    //         left: 0,
    //         top: 0,
    //         width: 0,
    //         height: 0
    //     })
    // });
}
function rightClick(){
    $body.contextmenu(function(e) {
        var target = e.target;
        console.log(getPathTo(target));
    });
    function getPathTo(element) {
        if (element.id)
            return 'id("' + element.id + '")';
        if (element === document.body)
            return element.tagName;

        var ix = 0;
        var siblings = element.parentElement.childNodes;
        for (var i = 0; i < siblings.length; i++) {
            var sibling = siblings[i];
            if (sibling === element)
                return getPathTo(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                ix++;
        }
    }
}
