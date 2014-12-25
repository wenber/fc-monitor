/**
 * @file recorder.js 记录器，记录用户的特殊行为
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');
    var globalData = require('./globalData');
    var browser = require('fc-core/browser');
    var memory = require('fc-storage/memory');
    var util = require('./util');
    var config = require('./config');

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
     * 需要绑定的事件名和hidden属性名
     * @type {Object}
     */
    var tabSwitchOpts = {};
    if ('undefined' !== document.hidden) {
        tabSwitchOpts.hidden = 'hidden';
        tabSwitchOpts.eventTypeList = ['visibilitychange'];
    }
    else if ('undefined' !== document.mozHidden) {
        tabSwitchOpts.hidden = 'mozHidden';
        tabSwitchOpts.eventTypeList = ['mozvisibilitychange'];
    }
    else if ('undefined' !== document.webkitHidden) {
        tabSwitchOpts.hidden = 'webkitHidden';
        tabSwitchOpts.eventTypeList = ['webkitvisibilitychange'];
    }
    else if ('undefined' !== document.msHidden) {
        tabSwitchOpts.hideen = 'msHidden';
        tabSwitchOpts.eventTypeList = ['msvisibilitychange'];
    }
    else if ('undefined' !== document.onfocusin) {
        // For IE 9
        tabSwitchOpts.hidden = null;
        tabSwitchOpts.eventTypeList = ['focusin', 'focusout'];
    }
    else {
        tabSwitchOpts.hidden = null;
        tabSwitchOpts.eventTypeList = [];
    }

    /**
     * 监听事件
     */
    function listenTabSwitchEvent() {
        var eventTypeList = tabSwitchOpts.eventTypeList;
        _.each(eventTypeList, function (type) {
            if (document.addEventListener) {
                document.addEventListener(type, tabSwitchHandler, false);
            }
            else if (document.attachEvent) {
                // 某些IE不支addEventListener
                document.attachEvent('on' + type, tabSwitchHandler);
            }
        });

        // 初始化一次状态
        tabSwitchHandler({});
    }

    function unbindTabSwitchEvent() {
        var eventTypeList = tabSwitchOpts.eventTypeList;
        _.each(eventTypeList, function (type) {
            if (document.removeEventListener) {
                document.removeEventListener(type, tabSwitchHandler);
            }
            else if (document.detachEvent) {
                // 某些IE不支removeEventListener
                document.detachEvent('on' + type, tabSwitchHandler);
            }
        });
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
            if ((tabSwitchOpts.hidden && document[tabSwitchOpts.hidden])
                || e.type === 'focusin') {
                mark();
            }
            else if ((tabSwitchOpts.hidden && !document[tabSwitchOpts.hidden])
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
            memory.updateItem(config.storageKey, {
                context: context
            });
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
        unbindTabSwitchEvent();
        return recorder;
    };
    return recorder;
});
