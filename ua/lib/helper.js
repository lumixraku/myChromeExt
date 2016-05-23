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

    helper.renderPerformacePanel = function(data, $performancePanel) {
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
        $basicInfo.html($basicInfo.html() + tplFn({
            items: data.perfTiming
        }));
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
