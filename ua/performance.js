$timingPanel = $('#timing_panel');
$memoryPanel = $('#memoryPanel');

var data = {
    resources: [],
    marks: [],
    measures: [],
    perfTiming: [], //timing after calc 
    timing: {}, //window.performance.timing 
    calcBasicInfo: {},
    allResourcesCalc: []
};
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
// msg from bg
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.from === 'bgToPerf') {
        // document.body.innerHTML = JSON.stringify(message);
        data.resources = message.message.resources;
        data.timing = message.message.timing;

        showPerformance(calcPerformance(data));
    }
});

function calcPerformance(data) {
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
    var timing = data.timing;
    data.perfTiming.push({
        value: data.allResourcesCalc.length,
        title: '请求',
        name: 'Total Requests'
    });

    data.perfTiming.push({
        value: data.requestsByDomain.length,
        title: '域名',
        name: 'Domains'
    });

    data.perfTiming.push({
        value: data.slowestCalls[0].loadtime,
        title: '耗时最长的请求',
        name: 'Slowest Call',
        unit: 'ms'
    });

    data.perfTiming.push({
        value: Math.floor(data.slowestCalls.reduceRight(function(a, b) {
            if (typeof a !== "number") {
                return a.duration + b.duration;
            }
            return a + b.duration;
        }) / data.slowestCalls.length),
        title: '平均请求耗时',
        unit: 'ms',
        name: 'Average Call'
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
        name: 'DOM Processing'
    });
    data.perfTiming.push({
        value: timing.responseStart - timing.requestStart,
        title: '请求耗时',
        name: 'Time to First Byte',
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
        name: 'DOM Content Loading'
    });
    data.perfTiming.push({
        value: timing.loadEventEnd - timing.navigationStart,
        title: '页面加载耗时',
        unit: 'ms',
        name: 'Total'
    });
    console.log(data);
    return data;

}

function showPerformance(data) {
    var itemsHtml = createBasicInfoItems(data.perfTiming);
    $timingPanel.html(itemsHtml);
}

function createBasicInfoItems(items){
    var html = ['<div class="infos">'];
    for (var i = 0; i < items.length; i++) {
         html.push ([

            '<div class="info">',
            '<div class="title">',
            items[i].name,
            '</div>',
            '<div class="val">',
            Math.round(items[i].value),
            '<span class="unit">',
            items[i].unit,
            '</span>',
            '</div>',
            '</div>',
        ].join(''));
    }
    html.push('</div>');
    return  html.join('');
}
