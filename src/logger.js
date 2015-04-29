/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file 监控发送
 * @description 发送监控数据
 *     提供以下方法
 *     - log: function (data, target) {}
 *         监控（或将监控数据存到队列中）
 *     - dump: function (option) {}
 *         发送监控
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports) {
    'use strict';

    var _ = require('underscore');
    var fc = require('fc-core');

    var config = require('./config');
    var globalData = require('./globalData');
    var logFramePool = require('./logFramePool');
    var storage = require('./storage');
    var EventTarget = require('mini-event/EventTarget');

    /**
     * 上一次监控的target，用于跟踪埋点之间的关系
     * 每一次调用log方法时都会更新这个值
     * 第一个埋点的lastTarget为'PAGE_LOAD'表示在此之前没有埋点
     *
     * @type {string}
     */
    var lastTarget = 'PAGE_LOAD';

    /**
     * 分类型的上一次监控target
     */
    var lastTargetCache = {};

    // 缓存日志的队列
    var queueCache = _.reduce(config.logType.aliasIndex, function (memo, val) {
        memo[val.alias] = [];
        return memo;
    }, {});

    /**
     * 进行一次监控
     * @param {Object} data 要监控的数据
     * @param {string=} target 可选的监控数据的target字段，会覆盖data中的target
     */
    exports.log = function (data, target) {
        exports.logWithType(data, 'custom', target);
    };

    /**
     * 进行一次监控，分类型
     * @param {Object} data 要监控的数据
     * @param {string} type 日志类型
     * @param {string=} target 可选的监控数据的target字段，会覆盖data中的target
     */
    exports.logWithType = function (data, type, target) {
        var logInfo = _.deepExtend({timestamp: +(new Date())}, data);
        type = type || 'custom';

        var queue = storage.getQueue(type);
        // 从storage中取出前一次没有发送的log
        if (queue && queue.length) {
            queue = queue.concat(queueCache[type]);
            queueCache[type] = queue;
            storage.updateQueue(type, []);
        }
        else {
            queue = queueCache[type];
        }

        if (target) {
            logInfo.target = target;
        }
        // 用时间戳和target, lastTarget可以串联中用户的行为日志
        logInfo.lastTarget = lastTarget;
        lastTarget = logInfo.target;
        // TODO(@Pride Leong) 平滑点升级，暂时先不加这个字段
        // logInfo['last' + _.pascalize(type) + 'Target'] = lastTargetCache[type];
        lastTargetCache[type] = logInfo.target;

        var url = window.location.hash;
        var path = url.split('~')[0].replace(/^#/, '') || '/';
        logInfo.path = path;

        logInfo.logVersion = config.logVersion;

        queue.push(logInfo);
        if (queue.length >= config[type].threshold) {
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
     * @property {string} options.xxx.method 分类型dump日志方式，默认值从配置获取
     *     xxx的取值可以是ajax|behavior|business|custom
     *     'local': 保存日志到localStorage中
     *     'console' 在控制台中打印日志
     *     'loghost' 将日志发送到日志主机
     * @property {string} options.type dump日志类型，默认是空，dump所有类型日志
     *     ''|undefined|null: dump全部日志
     *     'ajax': dump ajax日志
     *     'behavior': dump behavior日志
     *     'business': dump business日志
     *     'custom': dump custom日志
     *     'debug': dump debug日志
     *     'performance': dump performance日志
     *     'trace': dump trace日志
     */
    exports.dump = function (options) {
        options = options || {};
        var type = options.type;
        var toSend = _.deepExtend({timestamp: +(new Date())}, globalData);
        if (type && _.has(config.logType, type)) {
            var method;
            if (options[type]) {
                method = options[type].method;
            }
            method = method || options.method;
            method = method || config[type].defaultMethod || config.defaultMethod;
            var queue = queueCache[type];
            if (_.isFunction(exports.dumpMethod[method])
                && queue && queue.length) {
                exports.dumpMethod[method](_.extend({
                    total: queue.length,
                    logData: queue
                }, toSend), type);
                queue.length = 0;
            }
        }
        else if (!type) {
            // 不指定类型则dump全部日志
            _.each(queueCache, function (queue, type) {
                exports.dump(_.defaults({type: type}, options));
            });
        }
    };

    /**
     * 发送日志的方法
     */
    exports.dumpMethod = {
        // 将队列中的日志存到localStorage中
        local: function (logData, type) {
            storage.updateQueue(type, logData.logData);
        },

        // 将队列中的日志打印到控制台中
        console: function (logData, type) {
            window.console.log(JSON.stringify(logData, null, 4));
        },

        // 将队列中的日志发送到指定的日志主机
        loghost: function (logData, type) {
            exports.send(config.loghost, logData);
        }
    };

    /**
     * 返回日志数据，调试用
     * @return {Array.<Object>} 当前的log队列
     */
    exports._debugLogData = function () {
        return queueCache;
    };

    /**
     * 跨域请求，在iframe中构建form表单提交
     *
     * @param {string} path 请求地址
     * @param {Object} params 请求参数
     */
    exports.send = function (path, params) {
        logFramePool.getInstance().then(function (frame) {
            frame.once('logsended', function () {
                exports.fire('logsended', {
                    path: path,
                    params: params
                });
            });
            frame.send(path, params);
            logFramePool.releaseInstance(frame);
        });
    };

    EventTarget.enable(exports);
});
