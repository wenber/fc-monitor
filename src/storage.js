/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file storage local storage
 * @description 对localStorage的封装
 *     提供针对fc-monitor的接口方法
 *     - get            exports.get(key)                    Alias: getItem
 *         获取对象
 *     - update         exports.update(key, item)           Alias: updateItem
 *         更新对象
 *     - getQueue       exports.getQueue(type)
 *         获取type类型的日志队列
 *     - updateQueue    exports.updateQueue(type, queue)
 *         更新type类型的日志队列
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    var _ = require('underscore');
    var localStorage = require('fc-storage/localStorage');
    var globalData = require('./globalData');
    var config = require('./config');
    var cache = {};
    localStorage.updateItem(config.storageKey, cache);

    /**
     * 获取storage中的键
     * @return {string} 由userid和optid拼成的键值
     */
    function getKey() {
        return globalData.userid + '-' + globalData.optid;
    }

    /**
     * 获取storage的对象
     * @param {string} key 键名
     * @return {*}
     */
    exports.getItem = exports.get = function (key) {
        return cache[key];
    };

    /**
     * 更新storage中的对象
     * @param {string} key 键名
     * @param {*} item 键值
     */
    exports.updateItem = exports.update = function (key, item) {
        var id = getKey();
        var wrap = {};
        wrap[id] = cache;
        var encircle = {};
        encircle[key] = item;
        _.deepExtend(cache, encircle);
        localStorage.updateItem(config.storageKey, wrap);
    };

    /**
     * 获取storage中的log队列
     * @param {string} type log类型
     * @return {Array.<Object>}
     */
    exports.getQueue = function (type) {
        return (cache.queue || {})[type];
    };

    /**
     * 更新sotrage中的log队列
     * @param {string} type log类型
     * @param {Array.<Object>} queue 日志队列
     */
    exports.updateQueue = function (type, queue) {
        var wrap = {};
        wrap[type] = queue;
        exports.update('queue', wrap);
    };

    /**
     * 初始化
     */
    exports.init = function () {
        var item = localStorage.getItem(config.storageKey) || {};
        var key = getKey();
        _.deepExtend(cache, item[key]);
    };
});
