var comps, baseHref, fetchCount, reqCount, el, currentTab, docBody,
    doc = document,
    yscontext = new YSLOW.context(doc),
    windowId = parseInt(location.hash.slice(1), 10),
    reIgnore = /^(chrome\-extension|data|chrome|javascript|about|resource|jar|file):/i;



$(function(){
    fetchResult(YSLOW.peeler.peel(document));
    YSLOW.util.event.addListener('componentFetchDone', function () {
        // doc.ysview.show();
        //console.log(comps);
        var cset = arguments.length ? arguments[0].component_set : {};
        // component_info:Array[0]
        // components:Array[14]
        // cookies:"BAIDUID=0D4E214FCF51E4E9B7B21E3D8E9C65F7:FG=1; pgv_pvi=8748750848; locale=zh; BIDUPSID=0D4E214FCF51E4E9B7B21E3D8E9C65F7; PSTM=1463986001; BAIDULOC=12950584.427097_4835038.074741293_30_131_1463986126418; H5LOC=1; BD_UPN=123253; BD_HOME=0; H_PS_PSSID=; plus_cv=0::m:1-nav:250e8bac-hotword:ffd4f671; plus_lsv=9b5298d2b94c6f56; H_WISE_SIDS=106240_102907_106379_102567_104487_100273_102479_106197_106369_104483_106029_106064_104341_106323_106434_103999_106460_104845_104639_106071; BDSVRTM=15"
        // doc_comp:YSLOW.Component
        // domElementsCount:677
        // inline:Object
        // nextID:15
        // notified_fetch_done:true
        // onloadTimestamp:undefined
        // outstanding_net_request:0
        // root_node:document
        
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
        xhr.onreadystatechange = function () {
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
        YSLOW.util.event.fire('componentFetchProgress', {
            'total': fetchCount + 2,
            'current': reqCount,
            'last_component_url': url
        });
        if (reqCount === fetchCount) {  //所有的请求都有了响应
            YSLOW.util.event.fire('componentFetchProgress', {
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
            YSLOW.ComponentSet.prototype.setAfterOnload(setInjected, {
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
    buildComponentSet(YSLOW.util.setInjected(document,comps, docBody));
}
function buildComponentSet(comps) {
    var i, comp, len,
        cset = new YSLOW.ComponentSet(doc);// doc  是弹出window的doc

    for (i = 0, len = comps.length; i < len; i += 1) {
        comp = comps[i];//此时comp 是 rawinfo 经过 addComponent 才有完整信息
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
    inlineTags(YSLOW.util.getInlineTags(document));
}

function inlineTags(inline) {
    yscontext.component_set.inline = inline;

    // chrome.tabs.sendRequest(currentTab.id, {
    //     action: 'domElementsCount'
    // }, domElementsCount);
    domElementsCount(YSLOW.util.countDOMElements(document));
}
function domElementsCount(count) {
    yscontext.component_set.domElementsCount = count;

    // chrome.tabs.sendRequest(currentTab.id, {
    //     action: 'getDocCookies'
    // }, getDocCookies);
    getDocCookies(YSLOW.util.getDocCookies(document));
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
    chrome.runtime.sendMessage({url: comp.url, from: 'controller'}, function(response) {
        comp.cookie = response;
        if (last) {
            peelDone();
        }
    });
}
function peelDone() {
    var cset = yscontext.component_set;

    YSLOW.util.event.fire('componentFetchProgress', {
        'total': fetchCount + 2,
        'current': fetchCount + 2,
        'last_component_url': 'Done'
    });
    YSLOW.util.event.fire('peelComplete', {
        'component_set': cset
    });
    cset.notifyPeelDone();
}
