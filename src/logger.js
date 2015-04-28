/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file 监控发送
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports) {
    'use strict';

    var _ = require('underscore');
    var fc = require('fc-core');

    var config = require('./config');
    var globalData = require('./globalData');
    var localStorage = require('fc-storage/localStorage');
    var recorder = require('./recorder');

    /**
     * 上一次监控的target，用于跟踪埋点之间的关系
     * 每一次调用log方法时都会更新这个值
     * 第一个埋点的lastTarget为'PAGE_LOAD'表示在此之前没有埋点
     *
     * @type {string}
     */
    var lastTarget = 'PAGE_LOAD';

    /**
     * 缓存日志的队列
     * 在每一次dump之后会清空
     *
     * @type {Array.<Object>}
     */
    var queue = [];

    /**
     * 进行一次监控
     * @param {Object} data 要监控的数据
     * @param {string=} target 可选的监控数据的target字段，会覆盖data中的target
     */
    exports.log = function (data, target) {
        var logInfo = _.deepExtend({timestamp: +(new Date())}, data);
        if (target) {
            logInfo.target = target;
        }
        // 用时间戳和target, lastTarget可以串联中用户的行为日志
        logInfo.lastTarget = lastTarget;
        lastTarget = logInfo.target;

        var url = window.location.hash;
        var path = url.split('~')[0].replace(/^#/, '') || '/';

        logInfo.path = path;

        if (recorder.pageInactived) {
            logInfo.pageInactived = recorder.pageInactived;
            logInfo.inactivedDuration = recorder.inactivedDuration;
        }

        logInfo.logVersion = config.logVersion;

        queue.push(logInfo);
        if (queue.length >= config.threshold) {
            fc.setImmediate(function () {
                exports.dump();
            });
        }
    };

    /**
     * 发送日志
     * @param {Object} options 选项
     * @property {string} options.method dump日志的方式，默认值为'loghost'(可配)
     *     'local': 保存日志到localStorage中
     *     'console' 在控制台中打印日志
     *     'loghost' 将日志发送到日志主机
     */
    exports.dump = function (options) {
        options = options || {};
        var toSend = _.deepExtend({timestamp: +(new Date())}, globalData);
        toSend.logData = queue;
        toSend.total = queue.length;

        var method = options.method || config.defaultMethod;
        if (undefined === exports.dumpMethod[method]) {
            method = config.defaultMethod;
        }
        if ('function' === typeof exports.dumpMethod[method]) {
            exports.dumpMethod[method](toSend);
            // clear log queue
            queue.length = 0;
        }
    };

    /**
     * 发送日志的方法
     */
    exports.dumpMethod = {
        // 将队列中的日志存到localStorage中
        local: function (logData) {
            var key = globalData.userid + '-' + globalData.optid;
            var item = {};
            item[key] = {unsent: queue};
            localStorage.updateItem(config.storageKey, item);
        },

        // 将队列中的日志打印到控制台中
        console: function (logData) {
            window.console.log(JSON.stringify(logData, null, 4));
        },

        // 将队列中的日志发送到指定的日志主机
        loghost: function (logData) {
            exports.send(config.loghost, logData);
        }
    };

    /**
     * 返回日志数据，调试用
     * @return {Array.<Object>} 当前的log队列
     */
    exports._debugLogData = function () {
        return queue;
    };

    /**
     * 跨域请求，在iframe中构建form表单提交
     *
     * @param {string} path 请求地址
     * @param {Object} params 请求参数
     */
    exports.send = function (path, params) {
        var ifr = document.createElement('iframe');
        var idom = null;

        try {
            ifr.style.position = 'absolute';
            ifr.style.left = '-10000px';
            ifr.style.top = '-10000px';
            document.getElementsByTagName('body')[0].appendChild(ifr);
            // Create the form content.
            var win = ifr.contentWindow || ifr;  // 获取iframe的window对象
            idom = win.document;  // 获取iframe的document对象
        }
        catch (e) {}

        var html = ['<form id="f" action="', path, '" method="POST">'];
        for (var item in params) {
            if (params.hasOwnProperty(item)) {
                var eachValue = JSON.stringify(params[item]);

                html.push('<input type="hidden" name="', item, '" value="',
                    encodeURIComponent(eachValue), '"/>');
            }
        }
        html.push('</form>');
        var formContent = html.join('');
        idom.open();
        idom.write(formContent);
        idom.close();

        // Submit the form.
        idom.getElementById('f').submit();
        ifr.onload = function () {
            setTimeout(function () {
                ifr.parentNode.removeChild(ifr);
            }, 1000);
        };
    };
});
