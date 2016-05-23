var comps, baseHref, fetchCount, reqCount, el, currentTab, docBody,
    doc = document,
    yscontext = new YSLOW.context(doc),
    windowId = parseInt(location.hash.slice(1), 10),
    reIgnore = /^(chrome\-extension|data|chrome|javascript|about|resource|jar|file):/i;



$(function(){
    fetchResult(YSLOW.peeler.peel(document));
    YSLOW.util.event.addListener('componentFetchDone', function () {
        doc.ysview.show();
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
