(function() {
    var doc = document;
    var $body = $('body');
    var bodyWidth = 360;
    var controlWidth = 360;
    var HOVER_SHADOW = 'rgba(250,134,129,0.3)';
    var $control = $('<div>', {
        id: 'control_panel'
    });
    $control.html("<div id=\"performance_panel\">\n    <div id=\"basic-info\" class=\"info-panel\">\n        <div class=\"info-loading\">计算中...</div>\n    </div>\n    <div id=\"resource-info\" class=\"info-panel\">\n        <div class=\"info-loading\">计算中...</div>\n    </div>\n    <div id=\"time-info\" class=\"info-panel\">\n        <div class=\"info-loading\">计算中...</div>\n    </div>\n    <div id=\"req-info\" class=\"info-panel\">\n        <div class=\"info-loading\">计算中...</div>\n    </div>\n    <div id=\"grade-info\" class=\"info-panel\">\n        <div class=\"info-loading\">计算中...</div>\n    </div>\n    <div id=\"memory-info\" class=\"info-panel\">\n        <div class=\"info-loading\">计算中...</div>\n    </div>\n</div>\n");

    /********************************************************/
    //页面刷新时  传入url  //BG中会监测tab的刷新
    function sendToBG() {

        //不能直接将 window.performance 传给bg
        //消息传递要求值是可以序列化的  然而JSON.stringify(window.performance)
        //得到的结果是 "{}"
        chrome.runtime.sendMessage({
            timing: window.performance.timing,
            resources: window.performance.getEntriesByType("resource"),
            memory: {
                totalJSHeapSize: window.performance.memory.totalJSHeapSize,
                usedJSHeapSize: window.performance.memory.usedJSHeapSize,
                jsHeapSizeLimit: window.performance.memory.usedJSHeapSize
            }
        });
    }
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        //不是tab发来的消息
        if (!sender.tab) {
            console.log(message.url);
            if(message.url !== ''){
                if (location.href.indexOf(message.url) != -1 && location.href.indexOf('_/chrome/newtab?') == -1) {
                    bindEvents();
                    changeBody(helper.renderPerformacePanel);
                }
            }
        }
    });


    function changeBody(callback) {
        $(function() {
            //rem 的临时解决办法
            if (doc.documentElement.style.fontSize != '') {
                document.documentElement.style.fontSize = controlWidth / 10 + 'px';
            }


            //在同一个页面显示源页面和信息
            $body.css({
                width: bodyWidth,
                margin: 0
            });
            $body.find('*').each(function() {
                var elem = $(this)[0];
                var style = getComputedStyle(elem);
                if (style.position === 'fixed') {
                    if (parseInt(style.width) > bodyWidth)
                    //覆盖原page存在important
                    $(this).attr('style', $(this).attr('style') + '; ' + 'width: ' + bodyWidth + 'px !important');
                }
            });


            $control.css({
                position: 'fixed',
                left: $body.outerWidth(),
                top: 0,
                width: $(window).width() - $body.outerWidth(),
                height: $(window).height(),
                'overflow-y': 'scroll'
            });
            $body.parent().append($control);

            callback(calcPerformance({
                resources: [],
                marks: [],
                measures: [],
                perfTiming: [],
                calcBasicInfo: {},
                allResourcesCalc: [],
                memory: {}
            }));
        });
    }

    function bindEvents() {
        $body.on('mouseover', function(e) {
            var target = e.target;
            $(target).css({
                'background-color': HOVER_SHADOW,
                opacity: 0.5,
            });
            e.stopPropagation();
        });
        $body.on('mouseout', function(e) {
            var target = e.target;
            $(target).css({
                'background-color': '',
                opacity: ''
            });
            e.stopPropagation();
        });

        $body.on('contextmenu', function(e) {
            var target = e.target;
            var xpathtext = getXpath(target);
            e.preventDefault();
            alert(xpathtext);
        });

        var getPathTo = function(element) {
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
        };

        var getChildrenIndex = function(ele) {
            if (ele.sourceIndex) {
                return ele.sourceIndex - ele.parentNode.sourceIndex - 1;
            }
            //others
            var i = 0;
            while (ele = ele.previousElementSibling) {
                i++;
            }
            return i;
        };
        var getXpath = function(target) {
            var $parents = $(target).parents();
            var xpath = [];
            while ($parents.length) {
                var tag = Array.prototype.pop.apply($parents);
                if (!tag || !tag.tagName || tag.tagName.toLowerCase() == "body" || tag.tagName.toLowerCase() == "html") {
                    continue;
                }
                xpath.push(tag.tagName.toLowerCase() + getChildrenIndex(tag) + ">");
            }
            xpath.push(target.tagName.toLowerCase() + getChildrenIndex(target));
            return xpath.join('');
        };

    }
})();
