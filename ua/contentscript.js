(function() {
    var $body = $('body');
    var bodyWidth = 360;
    var controlWidth = 360;
    $control = $('<div>', {
        id: 'control_panel'
    });
    var $performancePanel = $('<div>', {
        id: 'performance_panel'
    });
    var $phoneFrame = $('<div>', {
        id: 'phoneFrame'
    });
    var phoneFrame = $phoneFrame[0];
    var HOVER_SHADOW = 'rgba(250,134,129,0.3)';

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
            if (location.href.indexOf(message.url) != -1 ) {
                // sendToBG();
                changeBody(bindEvents);
                showPerformance(calcPerformance({
                    resources: [],
                    marks: [],
                    measures: [],
                    perfTiming: [],
                    calcBasicInfo: {},
                    allResourcesCalc: [],
                    memory: {}
                }));
            }
        }
    });


    function changeBody(callback) {
        $(function() {

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
                        // $(this).css({
                        //     width: bodyWidth
                        // });
                        //覆盖原page存在important
                        $(this).attr('style', $(this).attr('style') + '; ' + 'width: '+ bodyWidth +'px !important');
                }
            });


            $body.parent().append($control);

            $control.css({
                position: 'fixed',
                left: $body.outerWidth(),
                top: 0,
                width: $(window).width() - $body.outerWidth(),
                height: $(window).height(),
                'overflow-y': 'scroll'
            });

            $control.append($performancePanel);
            callback();
        });
    }

    function bindEvents() {
        var phoneFrame = $phoneFrame[0];
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
                opacity:''
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
            while (ele = ele.previousElementSibling){
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


    function showPerformance(data) {
        var $basicInfo = $('<div>', {
            id: 'basic-info',
            'class': 'info-panel'
        });
        var $memoryInfo = $('<div>', {
            id: 'memory-info',
            'class': 'info-panel'
        });
        var $resourceInfo = $('<div>', {
            id: 'resource-info',
            'class': 'info-panel'
        });
        $performancePanel.append($basicInfo, $memoryInfo, $resourceInfo);
        /***********************************************/
        $basicInfo.html('<div class="panel-title">连接信息</div>');
        var tplFn = _.template(
            ['<div class="infos">',
                '<% for (var i=0; i < items.length; i++) { %>',
                '<div class="info connect-info">',
                '<div class="title">',
                '<%= items[i].name%>',
                '</div>',
                '<div class="val">',
                '<%= Math.round(items[i].value)%>',
                '<span class="unit">',
                '<%= items[i].unit%>',
                '</span>',
                '</div>',
                '<div class="popup">',
                '<%= items[i].desc %>',
                '</div>',
                '</div>',
                '<% } %>',
                '</div>'
            ].join(''));
        $basicInfo.html($basicInfo.html() + tplFn({ items: data.perfTiming }));
        /***********************************************/
        tplFn = _.template(
            ['<div class="infos">',
                '<div class="info">',
                '<div class="title">',
                '<%= item.name%>',
                '</div>',
                '<div class="val">',
                'JavaScript占用内存',
                '<%= item.used/1000/1000 %>Mb ',
                '(<%= Math.round(item.used/item.total*100)%>',
                '<span class="unit">%</span>)',
                '</div>',
                '</div>',
                '</div>'
            ].join(''));
        $memoryInfo.html('<div class="panel-title">内存信息</div>' + tplFn({
            item: {
                name: '当前页面Js占用内存',
                total: data.memory.totalJSHeapSize,
                used: data.memory.usedJSHeapSize,
                limit: data.memory.jsHeapSizeLimit
            }
        }));
        /***********************************************/
        var tplFn1 = _.template(
            ['<div class="infos">',
                '<% for (var i=0; i < item.list.length; i++) { %>',
                '<div class="info">',
                '<div class="title">',
                '<%= item.list[i].fileType%>',
                '</div>',
                '<div class="val">',
                '<%= item.list[i].count%> &nbsp; ',
                '(<%= Math.round(item.list[i].count/item.allreqs*100) %>',
                '<span class="unit">%</span>)',
                '</div>',
                '</div>',
                '<% } %>',
                '</div>'
            ].join(''));
        var tplFn2 = _.template(
            ['<div class="infos list">',
                '<% for (var i=0; i < item.list.length; i++) { %>',
                '<div class="info">',
                '<div class="title">',
                '<%= item.list[i].domain%> : ',
                '</div>',
                '<div class="val">',
                '<%= item.list[i].count%> &nbsp; ',
                '(<%= Math.round(item.list[i].count/item.allreqs*100) %>',
                '<span class="unit">%</span>)',
                '</div>',
                '</div>',
                '<% } %>',
                '</div>'
            ].join(''));
        $resourceInfo.html(['<div class="panel-title">资源信息</div>',
            tplFn1({
                item: {
                    list: data.fileTypeCounts,
                    allreqs: data.allRequestsCount
                }
            }),
            '<div class="panel-title">域名资源</div>',
            tplFn2({ item:{
                list: data.requestsByDomain,
                allreqs: data.allRequestsCount
            }})
        ].join(''));

    }

})();
