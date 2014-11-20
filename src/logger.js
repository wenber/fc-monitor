/**
 * @file 监控发送
 * @author Leo Wang(wangkemiao@baidu.com)
 */

define(function (require) {

    var fc = require('fc-core');
    var globalData = require('./globalData');

    var config = require('../context/config/monitor');
    var localStorage = require('fc-storage/localStorage');

    var lastTarget = 'PAGE_LOAD';

    var logData = [];

    var LOG_DATA_LENGTH_MAX = 13;

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
        var logInfo = fc.util.deepExtend({
            timestamp: +(new Date())
        }, data);

        if (target) {
            logInfo.target = target;
        }
        logInfo.lastTarget = lastTarget;

        logData.push(logInfo);
        if (logData.length >= LOG_DATA_LENGTH_MAX) {
            logger.asyncDump();
        }
        lastTarget = logInfo.target;
    };

    /**
     * dump unsent log with setTimeout
     * @param {Object} options dump options
     */
    logger.asyncDump = function (options) {
        setTimeout(function () {
            logger.dump(options);
        }, 0);
    };

    /**
     * dump unsent log
     * @param {Object} options dump options
     *     options.saveLocal 是否使用localStorage来存储未发送的数据
     */
    logger.dump = function (options) {
        var toSend = fc.util.deepExtend({
            timestamp: +(new Date())
        }, globalData);
        delete toSend.path;

        // 存储到localStorage的key，由globalData自动生成
        // 如果想区分用户，则需要在初始化时指定globalData.storageKey为相应的区分key
        var storageKey = globalData.storageKey;
        var storage = localStorage.getItem(storageKey);
        var unsentLog = storage.unsentLog || [];

        if (options && options.saveLocal) {
            unsentLog = unsentLog.concat(logData);
            localStorage.updateItem(storageKey, {
                unsentLog: unsentLog
            });
        }
        else {
            localStorage.updateItem(storageKey, {
                unsentLog: []
            });
            toSend.logData = [].concat(unsentLog, logData);
            toSend.total = toSend.logData.length;
            if (toSend.total > 0) {
                sendMethod(config.monitorUrl, toSend);
            }
        }
        // clear log queue
        logData.length = 0;
    };

    /**
     * debug log data
     * @private
     * @return {Object} 当前未发送的监控数据
     */
    logger._debugLogData = function () {
        return logData;
    };

    /**
     * 跨域请求，在iframe中构建form表单提交
     *
     * @param {string} path 请求地址
     * @param {Object} params 请求参数
     */
    function sendMethod (path, params) {
        var ifr = document.createElement('iframe');
        var idom = null;

        try {
            ifr.style.position = 'absolute';
            ifr.style.left = -10000;
            ifr.style.top = -10000;
            document.getElementsByTagName('body')[0].appendChild(ifr);
            // Create the form content.
            var win = ifr.contentWindow || ifr;  // 获取iframe的window对象
            idom = win.document;  // 获取iframe的document对象
        }
        catch(e) {
            // 原始ie8下iframe性能的限制，有可能存在iframe未准备好，拒绝访问
            return;
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
        ifr.onload = function () {
            setTimeout(function () {
                $(ifr).remove();
            }, 1000);
        };
        return;
    }

    return logger;
});
