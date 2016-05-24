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
