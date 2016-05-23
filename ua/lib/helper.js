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
