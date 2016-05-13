(function() {
    var $body;
    var bodyWidth = 360;
    var controlWidth = 540;
    var $control;
    var $xpathPanel;
    var $performancePanel;
    var $phoneFrame;


    $body = $('body');

    /***************/
    var helper;


    helper = (function() {
        var helper = {};

        //extract a resources file type
        helper.getFileType = function(fileExtension, initiatorType) {
            if (fileExtension) {
                switch (fileExtension) {
                    case "jpg":
                    case "jpeg":
                    case "png":
                    case "gif":
                    case "webp":
                    case "svg":
                    case "ico":
                        return "image";
                    case "js":
                        return "js";
                    case "css":
                        return "css";
                    case "html":
                        return "html";
                    case "woff":
                    case "woff2":
                    case "ttf":
                    case "eot":
                    case "otf":
                        return "font";
                    case "swf":
                        return "flash";
                    case "map":
                        return "source-map";
                }
            }
            if (initiatorType) {
                switch (initiatorType) {
                    case "xmlhttprequest":
                        return "ajax";
                    case "img":
                        return "image";
                    case "script":
                        return "js";
                    case "internal":
                    case "iframe":
                        return "html"; //actual page
                    default:
                        return "other";
                }
            }
            return initiatorType;
        };


        helper.endsWith = function(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        };


        //counts occurences of items in array arr and returns them as array of key valure pairs
        //keyName overwrites the name of the key attribute
        helper.getItemCount = function(arr, keyName) {
            var counts = {},
                resultArr = [],
                obj;

            arr.forEach(function(key) {
                counts[key] = counts[key] ? counts[key] + 1 : 1;
            });

            //pivot data
            for (var fe in counts) {
                obj = {};
                obj[keyName || "key"] = fe;
                obj.count = counts[fe];

                resultArr.push(obj);
            }
            return resultArr.sort(function(a, b) {
                return a.count < b.count ? 1 : -1;
            });
        };

        helper.clone = function(obj) {
            var copy;

            // Handle the 3 simple types, and null or undefined
            if (null === obj || "object" != typeof obj) return obj;

            // Handle Date
            if (obj instanceof Date) {
                copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }

            // Handle Array
            if (obj instanceof Array) {
                copy = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = helper.clone(obj[i]);
                }
                return copy;
            }

            // Handle Object
            if (obj instanceof Object) {
                copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = helper.clone(obj[attr]);
                }
                return copy;
            }

            throw new Error("Unable to helper.clone obj");
        };

        return helper;
    })();


    /********************************************************/
    //页面刷新时  传入url
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        //不是tab发来的消息
        if (!sender.tab) {
            console.log(message.url);
            if (location.href == message.url) {
                changeBody();
                hover();
                rightClick();
                showPerformance(calcPerformance({
                    resources: [],
                    marks: [],
                    measures: [],
                    perfTiming: [],
                    calcBasicInfo: {},
                    allResourcesCalc: []
                }));
            }
        }
    });


    function changeBody() {
        $phoneFrame = $('iframe',{
            width: 360,
            height:640,
            'border':'1px solid grey'
        })

        $body.css({
            width: bodyWidth,
            margin: 0//,
            // 'border-right':'1px solid grey'
        });
        $control = $('<div>', {
            id: 'control_panel'
        });
        $body.parent().append($control);
        $control.css({
            position: 'fixed',
            left: bodyWidth + 20,
            top: 0,
            width: $(window).width() - bodyWidth - 70,
            height: $(window).height() - 50,
            margin: 20,
            'overflow-y': 'scroll',
            'box-shadow': 'rgba(0, 0, 0, 0.5) 0px 0px 25px 0px'
        });
        $performancePanel = $('<div>', {
            id: 'performance_panel'
        });
        $performancePanel.css({

        });
        $control.append($performancePanel);
        //$($control[0].contentDocument.body).append($performancePanel);

        // $xpathPanel = $('<div>', {
        //     id: 'xpath_panel'
        // });
        // $control.append($xpathPanel);


    }

    function hover() {
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

    function rightClick() {
        $body.contextmenu(function(e) {
            var target = e.target;
            var xpathtext = getXpath(target);
            // var xpathtext = getPathTo(target);
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
        }

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
                xpath .push( tag.tagName.toLowerCase() + getChildrenIndex(tag) + ">" );
            }
            xpath.push(target.tagName.toLowerCase() + getChildrenIndex(target) );
            return xpath.join('');
        };

    }

    function calcPerformance(data) {
        data.resources = window.performance.getEntriesByType("resource");
        data.allResourcesCalc = data.resources
            //remove this bookmarklet from the result
            .filter(function(currR) {
                return !currR.name.match(/http[s]?\:\/\/(micmro|nurun).github.io\/performance-bookmarklet\/.*/);
            }).map(function(currR, i, arr) {
                //crunch the resources data into something easier to work with
                var isRequest = currR.name.indexOf("http") === 0;
                var urlFragments, maybeFileName, fileExtension;

                if (isRequest) {
                    urlFragments = currR.name.match(/:\/\/(.[^/]+)([^?]*)\??(.*)/);
                    maybeFileName = urlFragments[2].split("/").pop();
                    fileExtension = maybeFileName.substr((Math.max(0, maybeFileName.lastIndexOf(".")) || Infinity) + 1);
                } else {
                    urlFragments = ["", location.host];
                    fileExtension = currR.name.split(":")[0];
                }

                var currRes = {
                    name: currR.name,
                    domain: urlFragments[1],
                    initiatorType: currR.initiatorType || fileExtension || "SourceMap or Not Defined",
                    fileExtension: fileExtension || "XHR or Not Defined",
                    loadtime: currR.duration,
                    fileType: helper.getFileType(fileExtension, currR.initiatorType),
                    isRequestToHost: urlFragments[1] === location.host
                };

                for (var attr in currR) {
                    if (typeof currR[attr] !== "function") {
                        currRes[attr] = currR[attr];
                    }
                }

                if (currR.requestStart) {
                    currRes.requestStartDelay = currR.requestStart - currR.startTime;
                    currRes.dns = currR.domainLookupEnd - currR.domainLookupStart;
                    currRes.tcp = currR.connectEnd - currR.connectStart;
                    currRes.ttfb = currR.responseStart - currR.startTime;
                    currRes.requestDuration = currR.responseStart - currR.requestStart;
                }
                if (currR.secureConnectionStart) {
                    currRes.ssl = currR.connectEnd - currR.secureConnectionStart;
                }

                return currRes;
            });

        //filter out non-http[s] and sourcemaps
        data.requestsOnly = data.allResourcesCalc.filter(function(currR) {
            return currR.name.indexOf("http") === 0 && !currR.name.match(/js.map$/);
        });

        //get counts
        // initiatorType 为css  表示这个资源是从css文件发出的请求
        // 此外 script link img这些值表示是这些标签发出的请求
        data.initiatorTypeCounts = helper.getItemCount(data.requestsOnly.map(function(currR, i, arr) {
            return currR.initiatorType || currR.fileExtension;
        }), "initiatorType");

        data.initiatorTypeCountHostExt = helper.getItemCount(data.requestsOnly.map(function(currR, i, arr) {
            return (currR.initiatorType || currR.fileExtension) + " " + (currR.isRequestToHost ? "(host)" : "(external)");
        }), "initiatorType");

        data.requestsByDomain = helper.getItemCount(data.requestsOnly.map(function(currR, i, arr) {
            return currR.domain;
        }), "domain");

        data.fileTypeCountHostExt = helper.getItemCount(data.requestsOnly.map(function(currR, i, arr) {
            return currR.fileType + " " + (currR.isRequestToHost ? "(host)" : "(external)");
        }), "fileType");

        data.fileTypeCounts = helper.getItemCount(data.requestsOnly.map(function(currR, i, arr) {
            return currR.fileType;
        }), "fileType");

        var tempResponseEnd = {};
        //TODO: make immutable
        data.requestsOnly.forEach(function(currR) {
            var entry = data.requestsByDomain.filter(function(a) {
                return a.domain == currR.domain;
            })[0] || {};

            var lastResponseEnd = tempResponseEnd[currR.domain] || 0;

            currR.duration = entry.duration || currR.responseEnd - currR.startTime;

            if (lastResponseEnd <= currR.startTime) {
                entry.durationTotalParallel = (entry.durationTotalParallel || 0) + currR.duration;
            } else if (lastResponseEnd < currR.responseEnd) {
                entry.durationTotalParallel = (entry.durationTotalParallel || 0) + (currR.responseEnd - lastResponseEnd);
            }
            tempResponseEnd[currR.domain] = currR.responseEnd || 0;
            entry.durationTotal = (entry.durationTotal || 0) + currR.duration;
        });

        //Request counts
        data.hostRequests = data.requestsOnly.filter(function(domain) {
            return domain.domain === location.host;
        }).length;

        data.currAndSubdomainRequests = data.requestsOnly.filter(function(domain) {
            return domain.domain.split(".").slice(-2).join(".") === location.host.split(".").slice(-2).join(".");
        }).length;

        data.crossDocDomainRequests = data.requestsOnly.filter(function(domain) {
            return !helper.endsWith(domain.domain, document.domain);
        }).length;

        data.hostSubdomains = data.requestsByDomain.filter(function(domain) {
            return helper.endsWith(domain.domain, location.host.split(".").slice(-2).join(".")) && domain.domain !== location.host;
        }).length;

        data.slowestCalls = [];

        if (data.allResourcesCalc.length > 0) {
            data.slowestCalls = data.allResourcesCalc.filter(function(a) {
                //这里只计算页面中的资源的请求
                return a.name !== location.href;
            }).sort(function(a, b) {
                return b.duration - a.duration;
            });
        }

        /*****************************************************/
        var timing = window.performance.timing;
        data.perfTiming.push({
            value: data.allResourcesCalc.length,
            title: '请求',
            name: 'totalReuqest'
        });

        data.perfTiming.push({
            value: data.requestsByDomain.length,
            title: '域名',
            name: 'domains'
        });

        data.perfTiming.push({
            value: data.slowestCalls[0].loadtime,
            title: '耗时最长的请求',
            name: 'slowestCall',
            unit: 'ms'
        });

        data.perfTiming.push({
            value: Math.floor(data.slowestCalls.reduceRight(function(a, b) {
                if (typeof a !== "number") {
                    return a.duration + b.duration;
                }
                return a + b.duration;
            }) / data.slowestCalls.length),
            title: '请求平均耗时',
            unit: 'ms',
            name: 'averageCall'
        });

        data.perfTiming.push({
            value: timing.loadEventEnd - timing.navigationStart,
            title: '页面加载耗时',
            unit: 'ms',
            name: ''
        });
        data.perfTiming.push({
            value: timing.domainLookupEnd - timing.domainLookupStart,
            title: 'DNS查询时间',
            unit: 'ms',
            name: 'dnsElapse'
        });

        data.perfTiming.push({
            value: timing.domComplete - timing.domLoading,
            title: 'DOM 处理耗时',
            unit: 'ms',
            name: 'domProcessing'
        });
        data.perfTiming.push({
            value: timing.responseStart - timing.requestStart,
            title: '请求耗时',
            name: 'firstByte',
            unit: 'ms'
        });
        data.perfTiming.push({
            value: timing.responseStart - timing.navigationStart,
            title: '网络处理耗时',
            unit: 'ms',
            name: 'netWork',
        });
        data.perfTiming.push({
            value: timing.responseEnd - timing.responseStart,
            title: '浏览器处理响应耗时',
            unit: 'ms',
            name: 'contentDownloads'
        });
        data.perfTiming.push({
            value: timing.domContentLoadedEventStart - timing.domLoading,
            title: 'DOM下载耗时',
            unit: 'ms',
            name: 'domContentLoading'
        });
        console.log(data);
        return data;

    }

    function showPerformance(data) {
        //basic info
        var tempDiv = document.createElement('div');
        var $basicInfo = $('<div>', {
            id: 'basic-info',
            'class': 'info-panel'
        });
        $basicInfo.html('<div class="panel-title">页面加载信息</div>');
        var tplFn = _.template(
            [   '<div class="infos">',
                '<% for (var i=0; i < items.length; i++) { %>',
                '<div class="info">',
                '<div class="title">',
                '<%= items[i].title%>',
                '</div>',
                '<div class="val">',
                '<%= Math.round(items[i].value)%>',
                '<span class="unit">',
                '<%= items[i].unit%>',
                '</span>',
                '</div>',
                '</div>',
                '<% } %>',
                '</div>'
            ].join(''));

        $basicInfo.html($basicInfo.html() + tplFn({ items: data.perfTiming }));

        $performancePanel.append($basicInfo);
    }

})();