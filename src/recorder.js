/**
 * @file recorder.js 记录器，记录用户的特殊行为
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {
    'use strict';

    var globalData = require('./globalData');
    var browser = require('fc-core/browser');
    var util = require('./util');

    /**
     * 记录器，记录用户特别行为，如切换标签等
     * @type {Object}
     */
    var recorder = {};

    /**
     * 切换tab次数
     * @type {number}
     */
    recorder.pageInactived = 0;

    /**
     * 离开页面时间
     * @type {Array.<number>}
     */
    recorder.inactivedDuration = [];

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
        tabSwitchHandler({});
    }

    function mark() {
        recorder.pageInactived += 1;
        window.performance.mark('leave_tab');
    }

    function measure() {
        window.performance.mark('enter_tab');
        window.performance.measure('page_inactived', 'leave_tab', 'enter_tab');
        var measure = util.getEntry('page_inactived');
        recorder.inactivedDuration.push(measure.duration);
        window.performance.clearMeasures('page_inactived');
        window.performance.clearMarks('leave_tab');
        window.performance.clearMarks('enter_tab');
    }

    /**
     * 切换浏览器标签tab事件处理方法
     * @param {event} e 事件参数
     */
    function tabSwitchHandler(e) {
        try {
            var opts = getTabSwitchOpts();
            if ((opts.hidden && document[opts.hidden])
                || e.type === 'focusin') {
                mark();
            }
            else if ((opts.hidden && !document[opts.hidden])
                || e.type === 'focusout') {
                measure();
            }
        }
        catch (err) {}
    }

    /**
     * 更新全局信息
     * @param {Object} context 上下文信息，用户信息
     * @return {Object} recorder
     */
    recorder.init = function (context) {
        if (context) {
            recorder.updateGlobalData(context);
        }
        listenTabSwitchEvent();
        return recorder;
    };

    /**
     * 更新全局信息
     * @param {Object} context 上下文信息，用户信息
     * @return {Object} recorder
     */
    recorder.updateGlobalData = function (context) {
        globalData.userid = context.userid;
        globalData.optid = context.optid;
        globalData.ulevelid = context.ulevelid;
        globalData.token = context.token;
        globalData.nav = browser.getUserAgent();
        return recorder;
    };

    /**
     * 重置记录器
     * @return {Object} recorder
     */
    recorder.reset = function () {
        recorder.pageInactived = 0;
        recorder.inactivedDuration = [];
        return recorder;
    };
    return recorder;
});
