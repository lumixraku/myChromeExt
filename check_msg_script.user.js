// ==UserScript==
// @name          check msg script
// @namespace     http://admin.bytedance.com
// @description   check msg script
// @include       http://*t.qq.com/*
// @include       http://*weibo.com/*
// require        http://craigsworks.com/projects/qtip/packages/jquery-1.3.2.js
// @require       http://code.jquery.com/jquery-1.10.2.js
// @require       http://code.jquery.com/ui/1.11.4/jquery-ui.js
// @version       0.1.7.6
// @grant GM_addStyle
// @grant GM_xmlhttpRequest
// @grant GM_getResourceText
// @connect *
// @updateURL     http://admin.bytedance.com/crawl/static/msg_crawl/check_msg_script.user.js
// @downloadURL   http://admin.bytedance.com/crawl/static/msg_crawl/check_msg_script.user.js
// ==/UserScript==


//support update
var site_domain = 'admin.bytedance.com/dc/gm_support';
//var site_domain = '10.4.21.79:9161/dc/gm_support';
var PLATFORM_SINA_WEIBO = 1;
var PLATFORM_TENCENT_WEIBO = 2;

if (window.location.href.match(/weibo\.com/g) !== null){
    var all_links = {};
    $("a.W_f14.W_fb.S_txt1").each(function(index, element) {
        var name = $(element).attr('nick-name');
        var url = $(element).attr('href');
        var user_card = $(element).attr('usercard');

        if (user_card && url){
            user_card = user_card.split("=")[1];
            url = url.split("?")[0];
            url = url.split("/")[1];
            url = 'http://weibo.com/u/' + user_card;
            if (all_links[name]){
                return;
            }else{
                all_links[name] = url;
            }
        }
    });
}

//weibo_stats
if (window.location.href.match(/t\.qq\.com\/p\/t\/[\-\w]+$/) !== null ||
    window.location.href.match(/t\.qq\.com\/p\/t\/[\-\w]+\?apiType=8$/) !== null){
// t.qq.com
    var m = window.location.href.match(/t\.qq\.com\/p\/t\/([\-\w]+)/);
    var mid = m[1];
    var url = 'http://' + site_domain + '/check_weibo_stats/';
    GM_xmlhttpRequest({
        method: "POST",
        url: url,
        data:'platform_id='+PLATFORM_TENCENT_WEIBO+'&mid=' + mid,
        onload: function(response) {
            //alert(response.responseText);
            $('<div style="z-index:100;line-height:1.0;font-size:12px;position: absolute; background-color: black; color: white; right: 14px; top: 41px; padding: 10px;">' + response.responseText + '</div>').prependTo($('#topWrap'));
            $(function(){
                 $(".title").click(function(){
                       $(this).next(".content").toggle();
                        });
            });
        }
    });
} else if(window.location.href.match(/weibo\.com\/\d+\/\w+/g) !== null){
    //weibo.com
    var m = window.location.href.match(/weibo\.com\/(\d+)\/(\w+)/);
    var mid = m[2];
    var url = 'http://' + site_domain + '/check_weibo_stats/';
    var jscode = '';
    $("script").each(function( index ) {
        if ($(this).text().indexOf("CONFIG") >= 0 || $(this).text().indexOf("WB_detail") >= 0){
            jscode += $(this).text();
        }
    });
    jscode = encodeURIComponent(jscode);
    GM_xmlhttpRequest({
        method: "POST",
        url: url,
        data: 'platform_id=' + PLATFORM_SINA_WEIBO + '&mid=' + mid + '&html=' + jscode,
        onload: function(response) {
            $('<div style="line-height:1.0;font-size:12px;position: absolute; background-color: black; color: white; right: 44px; top: 41px; padding: 10px;z-index:100">' + response.responseText + '</div>').prependTo($('body'));
            $(function(){
                 $(".title").click(function(){
                       $(this).next(".content").toggle();
                        });
            });
            set_label_topic(topic_dict, mid, msg_text);
        }
    });
}

function set_label_topic(topic_dict, msg_id, msg_text){
    $("#topic_tags").autocomplete({
      source: availableTags,
      minLength: 0,
      open: function(){
        setTimeout(function () {
            $('.ui-autocomplete').css('z-index', 99999999999999);
        }, 0);
    }
    }).focus(function(){
            $(this).trigger('keydown.autocomplete');
        });

    var $hint = $('#result_text');
$('#submit_topic_msg').click(function() {
        $('#submit_topic_msg').prop('disabled', true);
        var rate = 0;
        var top = 0;
        var star = 0;
        var majia = 0;
        if ($('#check_box_rate').prop('checked'))
        {
            rate = 1;
        }
        if ($('#check_box_top').prop('checked'))
        {
            top = 1;
        }
        if ($('#check_box_star').prop('checked'))
        {
            star = 1;
        }
        if ($('#check_box_majia').prop('checked'))
        {
            majia = 1;
        }
        msg_text = encodeURIComponent($('#text_edit_area').val());

var url = 'http://' + site_domain + '/go_store_forum_msg/?msg_id=' + msg_id + '&rate=' + rate + '&top=' + top + '&star=' + star + '&majia=' + majia + '&topic_id=' + topic_dict[$("#topic_tags").val()] + '&platform_id=1&text=' + msg_text;
        $hint.html('发送中');
GM_xmlhttpRequest({
method: "GET",
url: url,
onload: function(response) {
                $('#submit_topic_msg').prop('disabled', false);
$hint.html(response.responseText);
}
});
});

$('#add_friend_' + uid).click(function() {
var url = 'http://' + site_domain + '/add_friendship/?platform_id=1&uid=' + uid;
        $hint.html('?ύ??');
GM_xmlhttpRequest({
method: "GET",
url: url,
onload: function(response) {
$hint.html(response.responseText);
}
});
});
}

//the sina weibo for enterprise
if (window.location.href.match(/weibo\.com\/profile\.php\?uid=/g) !== null) {
    var uid_node = $('#myfans');
    var a = uid_node.attr('href');
    var m = a.match(/weibo\.com\/(\d+)\/fans/);
    var uid = m[1];
    setUserCtrl(uid, PLATFORM_SINA_WEIBO);
}
//tencent enterprise weibo
else if (window.location.href.match(/e\.t\.qq\.com\/[\-\w]+$/) !== null) {
  var uid = window.location.href.match(/e\.t\.qq\.com\/([\-\w]+)/)[1];
      setUserCtrl(uid, PLATFORM_TENCENT_WEIBO);
          }
else
//weibo label
if (window.location.href.match(/t\.qq\.com\/p\/t\/[\-\w]+$/) !== null ||
    window.location.href.match(/t\.qq\.com\/[\-\w]+/) !== null ||
    window.location.href.match(/e\.t\.qq\.com\/[\-\w]+/) !== null ||
    window.location.href.match(/t\.qq\.com\/[\-\w]+\?filter=1$/) !== null ||
    window.location.href.match(/t\.qq\.com\/p\/t\/[\-\w]+\?apiType=8$/) !== null){
    //t.qq.com
    var uid;
var matched = window.location.href.match(/t\.qq\.com\/p\/t\/[\-\w]+$/);
    if (matched){
        var uid_node = $('#orginCnt div.userPic a');
        if (uid_node){
            uid = uid_node.attr("href").match(/\/([\-\w]+)/)[1];
        }
    }else{
        uid = window.location.href.match(/t\.qq\.com\/([\-\w]+)/)[1];
    }
    setUserCtrl(uid, PLATFORM_TENCENT_WEIBO);

}else if (window.location.href.match(/weibo\.com\/\d+\/\w+/g) !== null ||
        window.location.href.match(/weibo\.com\/u\/\d+/g) !== null ||
    window.location.href.match(/weibo\.com\/\d+/g) !== null ||
    window.location.href.match(/weibo\.com\/\w+/g) !== null){
    //weibo.com
    var iframe = $('iframe');
    var iframe_src = iframe.attr('src');
    if (iframe && iframe_src && iframe_src.match(/weibo\.com\/profile\.php\?uid=/g)){
        //alert(iframe_src);
        window.location.href = iframe_src;
    } else {
        if (window.location.href.match(/e\.weibo\.com\/\w+/g) !== null){
            var uid_str = $('#pl_leftNav_profileContent > .module_wrap > .nav_main dl:first-child > dt > a').attr("suda-uatrack");
            var uid = uid_str.match(/uid_(\d+)/)[1];
        }else{
            if (window.location.href.match(/weibo\.com\/\d+\/\w+/g) !== null){
                var m = window.location.href.match(/weibo\.com\/(\d+)\/(\w+)/);
                var uid = m[1];
            }
            else if (window.location.href.match(/weibo\.com\/u\/\d+/g) !== null){
                var m = window.location.href.match(/weibo\.com\/u\/(\d+)/);
                var uid = m[1];
            }
            else {

                var uid_node = $('#pl_content_medal')[0];
                if (uid_node){
                    var a = $(uid_node).attr('medalConf');
                    var m = a.match(/uid=(\d+)/);
                    var uid = m[1];
                }
            }
        }
        if (uid){
            setUserCtrl(uid, PLATFORM_SINA_WEIBO);
        }
    }
}

function setUserCtrl(uid, platform_id) {
    var url = 'http://' + site_domain + '/set_user_label_form/?platform_id='+platform_id+'&uid=' + uid;

    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function(response) {
            var resp_text = response.responseText;
            if (platform_id == PLATFORM_SINA_WEIBO){
                set_label_sina(resp_text, uid);
            }else if(platform_id==PLATFORM_TENCENT_WEIBO){
                set_label_qq(resp_text, uid);
            }
        }
    });
}

function set_label_qq(resp_text, uid){
    var analysis_url = 'http://' + site_domain + '/analyse_crawl/?platform_id=2&uid=' + uid;
$('<div style="z-index:100;line-height:1.0;font-size:12px;position: absolute; background-color: black; color: white; left: 5px; top: 52px; padding: 10px;">'+
        'uid:' + uid + '<a href="' + analysis_url + '" target="_blank">&nbsp&nbsp文章覆盖率</a>' +
        resp_text + '</div>').prependTo($('#topWrap'));
    var $hint = $('#result_text_' + uid);
$('#submit_set_label_' + uid).click(function() {
var url = 'http://' + site_domain + '/set_user_label/?' + getquerystring('set_label_' + uid);
        $hint.html('提交中');
GM_xmlhttpRequest({
method: "GET",
url: url,
onload: function(response) {
$hint.html(response.responseText);
}
});
});

$('#add_friend_' + uid).click(function() {
var url = 'http://' + site_domain + '/add_friendship/?platform_id=2&uid=' + uid;
        $hint.html('提交中');
GM_xmlhttpRequest({
method: "GET",
url: url, 
onload: function(response) {
$hint.html(response.responseText);
}   
});
});
}
function set_label_sina(resp_text, uid){
    var analysis_url = 'http://' + site_domain + '/analyse_crawl/?platform_id=1&uid=' + uid;
var resp_div = $('<div style="line-height:1.0;font-size:12px;position: absolute; background-color: black; color: white; left: 19px; top: 52px; padding: 10px; z-index:9999">' +
            'uid:' + uid + '<a href="' + analysis_url + '" target="_blank">&nbsp&nbsp文章覆盖率</a>' +
            resp_text + '</div>');
    resp_div.prependTo($('body'));

    var $hint = $('#result_text_' + uid);
$('#submit_set_label_' + uid).click(function() {
var url = 'http://' + site_domain + '/set_user_label/?' + getquerystring('set_label_' + uid);
        $hint.html('提交中');
GM_xmlhttpRequest({
method: "GET",
url: url, 
onload: function(response) {
$hint.html(response.responseText);
}   
});
});

$('#add_friend_' + uid).click(function() {
var url = 'http://' + site_domain + '/add_friendship/?platform_id=1&uid=' + uid;
        $hint.html('提交中');
GM_xmlhttpRequest({
method: "GET",
url: url, 
onload: function(response) {
$hint.html(response.responseText);
}   
});
});
    
$('#add_monitor_' + uid).click(function(){
    var url = 'http://' + site_domain + '/add_monitor/?platform_id=1&uid=' + uid;
    $hint.html('提交中');
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function(response) {
            $hint.html(response.responseText);
        }
    });
});
}

function getquerystring(formname) {
    var form = document.getElementById(formname);
    var qstr = "";

    function GetElemValue(name, value) {
        qstr += (qstr.length > 0 ? "&" : "")
            + escape(name).replace(/\+/g, "%2B") + "="
            + escape(value ? value : "").replace(/\+/g, "%2B");
        //+ escape(value ? value : "").replace(/\n/g, "%0D");
    }
    var elemArray = form.elements;
    for (var i = 0; i < elemArray.length; i++) {
        var element = elemArray[i];
        var elemType = element.type.toUpperCase();
        var elemName = element.name;
        if (elemName) {
            if (elemType == "TEXT"
                    || elemType == "TEXTAREA"
                    || elemType == "PASSWORD"
                    || elemType == "BUTTON"
                    || elemType == "RESET"
                    || elemType == "SUBMIT"
                    || elemType == "FILE"
                    || elemType == "IMAGE"
                    || elemType == "HIDDEN")
                GetElemValue(elemName, element.value);
            else if (elemType == "CHECKBOX" && element.checked)
                GetElemValue(elemName, 
                    element.value ? element.value : "On");
            else if (elemType == "RADIO" && element.checked)
                GetElemValue(elemName, element.value);
            else if (elemType.indexOf("SELECT") != -1)
                for (var j = 0; j < element.options.length; j++) {
                    var option = element.options[j];
                    if (option.selected)
                        GetElemValue(elemName,
                            option.value ? option.value : option.text);
                }
        }
    }
    return qstr;
}
