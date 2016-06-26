;/*!/contentscript.js*/
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
            if (message.url !== '') {
                if (location.href.indexOf(message.url) != -1 && location.href.indexOf('_/chrome/newtab?') == -1) {
                    bindEvents();
                    changeBody(helper.renderPerformacePanel);
                    controller();
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

    function controller() {

        //content script
        var comps, baseHref, fetchCount, reqCount, el, currentTab, docBody,
            doc = document,
            yscontext = new MYSLOW.context(doc),
            windowId = parseInt(location.hash.slice(1), 10),
            reIgnore = /^(chrome\-extension|data|chrome|javascript|about|resource|jar|file):/i;



        $(function() {
            fetchResult(MYSLOW.peeler.peel(document));
            MYSLOW.util.event.addListener('componentFetchDone', function() {
                var cset = arguments.length ? arguments[0].component_set : {};
                MYSLOW.controller.lint(doc, yscontext);
                //lint 的结果yscontext.result_set.results
                //资源大小 yscontext.component_set.components
                //资源分类总和 yscontext.PAGE.totalObjSize
                helper.renderYslowPanel(yscontext);
            });
        });

        function fetchResult(result) {
            var i,
                len = result.length;

            comps = [];
            fetchCount = len;
            reqCount = 0;
            for (i = 0; i < len; i += 1) {
                request(result[i]);
            }

            function request(comp) {
                var xhr;

                if (!comp.href || reIgnore.test(comp.href)) {
                    if (!comp.href) {
                        comps.push(comp);
                    }
                    return checkRender();
                }

                comp.url = comp.href;
                xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        comp.status = xhr.status;
                        comp.content = xhr.responseText;
                        comp.rawHeaders = xhr.getAllResponseHeaders() || '';
                        comps.push(comp);
                        checkRender(comp.href);
                    }
                };
                xhr.open('GET', comp.href, true);
                xhr.send();
            }

            function checkRender(url) {
                var i, len, comp;

                reqCount = reqCount + 1;
                MYSLOW.util.event.fire('componentFetchProgress', {
                    'total': fetchCount + 2,
                    'current': reqCount,
                    'last_component_url': url
                });
                if (reqCount === fetchCount) { //所有的请求都有了响应
                    MYSLOW.util.event.fire('componentFetchProgress', {
                        'total': fetchCount + 2,
                        'current': fetchCount + 1,
                        'last_component_url': 'Checking post onload components'
                    });
                    docBody = '';
                    for (i = 0, len = comps.length; i < len; i += 1) {
                        comp = comps[i];
                        if (comp.type === 'doc') {
                            docBody = comp.content;
                            break;
                        }
                    }
                    // chrome.tabs.sendRequest(currentTab.id, {
                    //     action: 'afterOnload',
                    //     docBody: docBody,
                    //     components: comps
                    // }, setInjected);
                    MYSLOW.ComponentSet.prototype.setAfterOnload(setInjected, {
                        docBody: docBody,
                        doc: document,
                        components: comps
                    });
                }
            }
        }

        function setInjected(comps) {
            // chrome.tabs.sendRequest(currentTab.id, {
            //     action: 'injected',
            //     docBody: docBody,
            //     components: comps
            // }, buildComponentSet);
            buildComponentSet(MYSLOW.util.setInjected(document, comps, docBody));
        }

        function buildComponentSet(comps) {
            var i, comp, len,
                cset = new MYSLOW.ComponentSet(doc); // doc  是弹出window的doc

            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i]; //此时comp 是 rawinfo 经过 addComponent 才有完整信息
                cset.addComponent(comp.href, comp.type,
                    comp.base ? comp.base : baseHref, {
                        obj: comp.obj,
                        component: comp,
                        comp: comp
                    }); //调用yslow-chrome 中的addComponent()   (L213)
            }
            yscontext.component_set = cset;

            // chrome.tabs.sendRequest(currentTab.id, {
            //     action: 'inlineTags'
            // }, inlineTags);
            inlineTags(MYSLOW.util.getInlineTags(document));
        }

        function inlineTags(inline) {
            yscontext.component_set.inline = inline;

            // chrome.tabs.sendRequest(currentTab.id, {
            //     action: 'domElementsCount'
            // }, domElementsCount);
            domElementsCount(MYSLOW.util.countDOMElements(document));
        }

        function domElementsCount(count) {
            yscontext.component_set.domElementsCount = count;

            // chrome.tabs.sendRequest(currentTab.id, {
            //     action: 'getDocCookies'
            // }, getDocCookies);
            getDocCookies(MYSLOW.util.getDocCookies(document));
        }

        function getDocCookies(cookies) {
            var i, len,
                cset = yscontext.component_set,
                comps = cset.components;

            cset.cookies = cookies;

            //comps 似乎就是页面中所发的各个请求
            for (i = 0, len = comps.length; i < len; i += 1) {
                getCookies(comps[i], i === len - 1);
            }
        }

        function getCookies(comp, last) {
            chrome.runtime.sendMessage({ url: comp.url, from: 'controller' }, function(response) {
                comp.cookie = response;
                if (last) {
                    peelDone();
                }
            });
        }

        function peelDone() {
            var cset = yscontext.component_set;
            yscontext.collectStats();
            processData(yscontext);
            MYSLOW.util.event.fire('componentFetchProgress', {
                'total': fetchCount + 2,
                'current': fetchCount + 2,
                'last_component_url': 'Done'
            });
            MYSLOW.util.event.fire('peelComplete', {
                'component_set': cset
            });
            cset.notifyPeelDone();
        }

        function processData(cset) {
            var totalSize = yscontext.PAGE.totalSize;
            var timing = window.performance.timing;
            yscontext.estimateTime = [{
                networkType: '2G',
                speed: 50,
            }, {
                networkType: '3G',
                speed: 250,
            }, {
                networkType: 'WiFi',
                speed: 1000
            }];
            yscontext.estimateTime = yscontext.estimateTime.map(function(item) {
                item.downloadTime = yscontext.PAGE.totalSize / 1000 / item.speed;
                item.totalTime = (timing.responseStart - timing.navigationStart + timing.loadEventEnd - timing.domLoading) / 1000 + item.downloadTime;
                return item;
            });
        }
    }
})();

;/*!/performance.js*/
/*计算并整理 window.performance的结果*/

function calcPerformance(data) {
    data.resources = window.performance.getEntriesByType("resource");
    data.allResourcesCalc = data.resources
        .map(function(currR, i, arr) {
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
    data.allRequestsCount = data.requestsOnly.length;

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
        name: 'Total Reuqests',
        desc: '全部请求数量</br> 请求越多 页面加载时间也越长'
    });

    data.perfTiming.push({
        value: data.requestsByDomain.length,
        title: '域名',
        name: 'Domains',
        desc: '全部资源所涉及到的域名</br> 过多过少的域名都会导致加载时间变长'
    });

    data.perfTiming.push({
        value: data.slowestCalls[0].loadtime,
        title: '耗时最长的请求',
        name: 'Slowest Call',
        unit: 'ms',
        desc: '耗时最长的请求'
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
        name: 'Average Call',
        desc: '请求平均耗时'
    });
    data.perfTiming.push({
        value: timing.domainLookupStart - timing.fetchStart,
        title: '浏览器读取缓存时间',
        unit: 'ms',
        name: 'cacheElapse',
        desc: '浏览器读取缓存时间'
    });
    data.perfTiming.push({
        value: timing.domainLookupEnd - timing.domainLookupStart,
        title: 'DNS查询时间',
        unit: 'ms',
        name: 'dnsElapse',
        desc: 'DNS查询时间</br> 该值由domainLookupEnd 减去 domainLookupStart得到'
    });

    data.perfTiming.push({
        //domLoading 是开始处理dom的时候 此时responEnd 理论上已经结束
        //domLoading  返回用户代理把其文档的 "current document readiness" 设置为 "loading"的时候
        //domComplete  返回用户代理把其文档的 "current document readiness" 设置为 "complete"的时候
        //就是 dom的readyState为 loading  complete的时候
        value: timing.domComplete - timing.domLoading,
        title: 'DOM 处理耗时',
        unit: 'ms',
        name: 'DOM Processing',
        desc: '解析DOM结构时间</br>  该值由domComplete 减去 domLoading得到'
    });
    data.perfTiming.push({
        value: timing.responseStart - timing.requestStart,
        title: '请求耗时',
        name: 'Time to First Byte',
        unit: 'ms',
        desc: '浏览器在拿到第一个资源的等待时间</br> 是否配置了异地机房，CDN，带宽等都会影响这个结果  该值由responseStart 减去 requestStart得到'
    });
    data.perfTiming.push({
        value: timing.responseEnd - timing.responseStart,
        title: '下载资源耗时',
        unit: 'ms',
        name: 'contentDownloads',
        desc: '下载资源耗时</br> 静态资源数量，大小都会影响下载时间 该值由responseEnd 减去 responseStart 得到'
    });
    data.perfTiming.push({
        value: timing.loadEventEnd - timing.navigationStart,
        title: '页面加载耗时',
        unit: 'ms',
        name: ' Total',
        desc: '页面加载完成的时间</br> 这几乎代表了用户等待页面可用的时间 该值由 loadEventEnd 减去 navigationStart 得到'
    });

    /*****************************************/
    data.memory = window.performance.memory;

    console.log(data);
    return data;

}
