//【必要】当前子项目名称
var PROJECT_NAME = 'ua';

//开发发布目录
var DEPLOY = {
    hehe: {
        receiver: '',
        dev_root: '/Users/luonan/Sites/myChromeExt/ua/build/'
    }
};

fis.config.merge({
    deploy: (function () {
        var reps = {};
        var devUser;
        for(var key in DEPLOY) {
            devUser = DEPLOY[key];
            reps[key] = [{
                receiver: devUser.receiver,
                from : '/',
                to : devUser.dev_root + '/'
            }];
        }
        return reps;
    })()
});



fis.config.set('roadmap.path', [{
        reg : /(\.tmpl|\.json)$/,
        isJsLike : true,
        release : false
    }, {
        reg : /^lib\/helper.js$/
    }]
);

// fis.config.merge({
//     modules: {
//         parser: {
//             tmpl: 'template'
//         }
//     },
//     roadmap: {
//         path : [
//             {
//                 //前端模板
//                 reg : '**.tmpl',
//                 //当做类js文件处理，可以识别__inline, __uri等资源定位标识
//                 isJsLike : true,
//                 //只是内嵌，不用发布
//                 release : false
//             }
//         ]
//     },
//     settings: {
//         parser: {
//             template: {
//                 'sTag': '<%',
//                 'eTag': '%>',
//                 'global': 'mytemplate',
//                 'compress': true
//             }
//         }
//     }
// });
