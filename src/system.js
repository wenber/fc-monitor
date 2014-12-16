/**
 * @file 环境 - 系统时间点记录器
 * @author Leo Wang(wangkemiao@baidu.com)
 */

define(function (require) {
    'use strict';

    var globalData = require('./globalData');
    var recorder = require('./recorder');

    function initUserBehaviorMonitor () {
        // 监听切换浏览器标签事件
        listenTabSwitchEvent();
    }

    /**
     * 获取需要绑定的事件名和hidden属性名
     * @return {Object} opts 根据不同浏览器返回不同的事件名和属性名
     */
    function getTabSwitchOpts() {
        var opts = {};
        if ('undefined' !== document.hidden) {
            opts.hidden = 'hidden';
            opts.eventTypeList = ['visibilitychange'];
        }
        else if ('undefined' !== document.mozHidden) {
            opts.hidden = 'mozHidden';
            opts.eventTypeList = ['mozvisibilitychange'];
        }
        else if ('undefined' !== document.webkitHidden) {
            opts.hidden = 'webkitHidden';
            opts.eventTypeList = ['webkitvisibilitychange'];
        }
        else if ('undefined' !== document.msHidden) {
            opts.hideen = 'msHidden';
            opts.eventTypeList = ['msvisibilitychange'];
        }
        else if ('undefined' !== document.onfocusin) {
            // For IE 9
            opts.hidden = null;
            opts.eventTypeList = ['focusin', 'focusout'];
        }
        else {
            opts.hidden = null;
            opts.eventTypeList = [];
        }
        return opts;
    }

    /**
     * 监听事件
     */
    function listenTabSwitchEvent() {
        var opts = getTabSwitchOpts();
        var eventTypeList = opts.eventTypeList;
        var i = 0;
        var len = eventTypeList.length;
        var type;
        if (document.addEventListener) {
            for (i = 0; i < len; i++) {
                type = eventTypeList[i];
                document.addEventListener(type, tabSwitchHandler, false);
            }
        }
        else if (document.attachEvent) {
            // 某些IE不支addEventListener
            for (i = 0; i < len; i++) {
                type = eventTypeList[i];
                document.attachEvent('on' + type, tabSwitchHandler);
            }
        }
        else {
            // 其它情况直接绑定
            for (i = 0; i < len; i++) {
                type = eventTypeList[i];
                document['on' + type] = tabSwitchHandler;
            }
        }

        // 初始化一次状态
        tabSwitchHandler();
    }

    /**
     * 切换浏览器标签tab事件处理方法
     */
    function tabSwitchHandler() {
        var opts = getTabSwitchOpts();
        if (opts && opts.hidden !== null && document[opts.hidden]) {
            recorder.pageInactived = true;
        }
    }

    function updateGlobalData (context) {
        var userInfo = context.getItem('userInfo');
        globalData.userid = userInfo.userid;
        globalData.optid = userInfo.optid;
        globalData.ulevelid = userInfo.ulevelid;
        globalData.token = userInfo.token;
    }

    /**
     * 系统级别的加载监控初始化
     * TODO(wangkemiao): for jsduck
     */
    var system = {
        init: function () {
            initUserBehaviorMonitor();
        },
        updateGlobalData: function (context) {
            updateGlobalData(context);
        }
    };

    return system;
});
