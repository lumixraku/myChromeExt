var helper;
helper = (function() {
    var helper = {};

    function template (id, data) {
        var me = arguments.callee;
        if (!me.cache[id]) me.cache[id] = (function () {
            var name = id, string = /^[\w\-]+$/.test(id) ? me.get(id): (name = 'template(string)', id); // no warnings
            var line = 1, body = (
                "try { " +
                    (me.variable ?  "var " + me.variable + " = this.stash;" : "with (this.stash) { ") +
                        "this.ret += '"  +
                        string.
                            replace(/<%/g, '\x11').replace(/%>/g, '\x13'). // if you want other tag, just edit this line
                            replace(/'(?![^\x11\x13]+?\x13)/g, '\\x27').
                            replace(/^\s*|\s*$/g, '').
                            replace(/\n/g, function () { return "';\nthis.line = " + (++line) + "; this.ret += '\\n" }).
                            replace(/\x11=raw(.+?)\x13/g, "' + ($1) + '").
                            replace(/\x11=(.+?)\x13/g, "' + this.escapeHTML($1) + '").
                            replace(/\x11(.+?)\x13/g, "'; $1; this.ret += '") +
                    "'; " + (me.variable ? "" : "}") + "return this.ret;" +
                "} catch (e) { throw 'TemplateError: ' + e + ' (on " + name + "' + ' line ' + this.line + ')'; } " +
                "//# sourceURL=" + name + "\n" // source map
            ).replace(/this\.ret \+= '';/g, '');
            var func = new Function(body);
            var map  = { '&' : '&amp;', '<' : '&lt;', '>' : '&gt;', '\x22' : '&#x22;', '\x27' : '&#x27;' };
            var escapeHTML = function (string) { return (''+string).replace(/[&<>\'\"]/g, function (_) { return map[_] }) };
            return function (stash) { return func.call(me.context = { escapeHTML: escapeHTML, line: 1, ret : '', stash: stash }) };
        })();
        return data ? me.cache[id](data) : me.cache[id];
    }
    template.cache = {};
    template.get = function (id) { return document.getElementById(id).innerHTML };
    helper.template = template;

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




    helper.renderYslowPanel = function(data, $performancePanel){
        var $reqInfo = $('#req-info');
        var $gradeInfo = $('#grade-info');
        var tplFn1 = helper.template(__inline('../tmpl/req1.tmpl'));
        var tplFn2 = helper.template(__inline('../tmpl/req2.tmpl'));
        $reqInfo.html(['<div class="panel-title">请求信息</div>', tplFn1({
            item:{
                domCount: data.component_set.domElementsCount,
                totalRequests: data.PAGE.totalRequests,
                totalSize: (data.PAGE.totalSize/1000).toFixed(2) + 'Kb',
            }
        }), '<div class="panel-title">分类请求信息</div>',tplFn1({
            item: (function(){
                var o = {};
                for(var key in data.PAGE.totalObjSize){
                    o[key] = (data.PAGE.totalObjSize[key]/1000).toFixed(2) + 'Kb';
                }
                return o;
            })()
        }), '<div class="panel-title">详细资源请求</div>',tplFn2({
            list: data.component_set.components
        })].join(''));
        var tplFn3 = helper.template(__inline('../tmpl/grade.tmpl'));
        $gradeInfo.html(['<div class="panel-title">页面性能指标和建议</div>',tplFn3({
            list: data.result_set.results
        })].join(''));

    };
    helper.renderPerformacePanel = function(data) {
        var $basicInfo = $('#basic-info');
        var $memoryInfo = $('#memory-info');
        var $resourceInfo = $('#resource-info');
        var tplFn = helper.template(__inline('../tmpl/load.tmpl'));
        $basicInfo.html(tplFn({
            items: data.perfTiming
        }));
        var tplFn0 = helper.template(__inline('../tmpl/memory.tmpl'));
        $memoryInfo.html(tplFn0({
            item: {
                name: '当前页面Js占用内存',
                total: data.memory.totalJSHeapSize,
                used: data.memory.usedJSHeapSize,
                limit: data.memory.jsHeapSizeLimit
            }
        }));
        var tplFn1 = helper.template(__inline('../tmpl/res.tmpl'));
        var tplFn2 = helper.template(__inline('../tmpl/resByDomain.tmpl'));
        $resourceInfo.html([
            tplFn1({
                item: {
                    list: data.fileTypeCounts,
                    allreqs: data.allRequestsCount
                }
            }),
            tplFn2({
                item: {
                    list: data.requestsByDomain,
                    allreqs: data.allRequestsCount
                }
            })
        ].join(''));

    };

    return helper;
})();
