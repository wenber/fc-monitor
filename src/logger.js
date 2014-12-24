/**
 * @file 监控发送
 * @author Leo Wang(wangkemiao@baidu.com)
 */

define(function (require) {
    'use strict';

    var _ = require('underscore');
    var fc = require('fc-core');

    var config = require('./config');
    var globalData = require('./globalData');
    var localStorage = require('fc-storage');
    var recorder = require('./recorder');

    var lastTarget = 'PAGE_LOAD';

    var queue = [];

    /**
     * logger定义
     */
    var logger = {};

    /**
     * 进行一次监控
     * @param {Object} data 要监控的数据
     * @param {string=} target 可选的监控数据的target字段，会覆盖data中的target
     */
    logger.log = function (data, target) {
        var logInfo = _.deepExtend({timestamp: +(new Date())}, data);
        if (target) {
            logInfo.target = target;
        }
        logInfo.lastTarget = lastTarget;
        lastTarget = logInfo.target;

        var url = window.location.hash;
        var path = url.split('~')[0].replace(/^#/, '') || '/';

        logInfo.path = path;

        if (recorder.pageInactived) {
            logInfo.pageInactived = recorder.pageInactived;
            logInfo.inactivedDuration = recorder.inactivedDuration;
        }

        queue.push(logInfo);
        if (queue.length >= config.threshold) {
            fc.setImmediate(function () {
                logger.dump();
            });
        }
    };

    /**
     * dump unsent log
     * @param {Object} options
     *  options.method: dump method
     *      'local': save log data to local storage;
     *      'console' dump log data to console;
     *      'loghost' dump log data to log server, default;
     */
    logger.dump = function (options) {
        options = options || {};
        var toSend = _.deepExtend({timestamp: +(new Date())}, globalData);
        toSend.logData = queue;
        toSend.total = queue.length;

        var method = options.method || config.defaultMethod;
        if (undefined === logger.dumpMethod[method]) {
            method = config.defaultMethod;
        }
        if ('function' === typeof logger.dumpMethod[method]) {
            logger.dumpMethod[method](toSend);
            // clear log queue
            queue.length = 0;
        }
    };

    logger.dumpMethod = {
        local: function (logData) {
            var key = globalData.userid + '-' + globalData.optid;
            var item = {};
            item[key] = {unsent: queue};
            localStorage.updateItem(config.storageKey, item);
        },
        console: function (logData) {
            var controlBooth = window.console;
            controlBooth.log(JSON.stringify(logData, null, 4));
        },
        loghost: function (logData) {
            sendMethod(config.loghost, logData);
        }
    };

    /**
     * debug log data
     * @return {Array.<Object>} queue, each log data in sendding queue
     */
    logger._debugLogData = function () {
        return queue;
    };

    /**
     * 跨域请求，在iframe中构建form表单提交
     *
     * @param {string} path 请求地址
     * @param {Object} params 请求参数
     * @return {string} the content of the form in debug mode, or empty string.
     */
    function sendMethod(path, params) {
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
        catch(e) {
            // 原始ie8下iframe性能的限制，有可能存在iframe未准备好，拒绝访问
            return '';
        }

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
        ifr.onload = function() {
            setTimeout(function() {
                $(ifr).remove();
            }, 1000);
        };
        return '';
    }

    return logger;
});
