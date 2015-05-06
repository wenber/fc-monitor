/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file util.js utils
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    'use strict';

    /**
     * 通过名字获取一个PerformanceEntry实例
     * @param {string} name 实例名
     * @return {PerformanceEntry}
     */
    exports.getEntry = function (name) {
        var entry = null;
        try {
            entry = [].slice.call(
                window.performance.getEntriesByName(name),
                0
            ).pop();
        }
        catch (e) {
        }
        return entry;
    };

    exports.getEntries = window.performance.getEntries
        || window.performance.mozGetEntries
        || window.performance.msGetEntries
        || window.performance.oGetEntries
        || window.performance.webkitGetEntries
        || null;

    /**
     * 性能标记
     * @param {string} name 标记名
     * @return {PerformanceMark}
     */
    exports.mark = function (name) {
        var entry = null;
        try {
            window.performance.mark(name);
            entry = exports.getEntry(name);
        }
        catch (err) {}
        return entry;
    };

    /**
     * 测量
     * @param {string} name 测量名
     * @param {string} start 测量开始标记名
     * @param {string} end 测量结果标记名
     * @return {PerformanceMeasure}
     */
    exports.measure = function (name, start, end) {
        var entry = null;
        try {
            window.performance.measure(name, start, end);
            entry = exports.getEntry(name);
        }
        catch (err) {}
        return entry;
    };

    /**
     * 清除mark对象
     */
    exports.clearMarks = function () {
        try {
            window.performance.clearMarks.apply(window, arguments);
        }
        catch (err) {}
    };

    /**
     * 清除measure对象
     */
    exports.clearMeasures = function () {
        try {
            window.performance.clearMeasures.apply(window, arguments);
        }
        catch (err) {}
    };

    exports.createEventId = function () {
        return require('fc-core').util.guid();
    };

    return module.exports = exports;
});
