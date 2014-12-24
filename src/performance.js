/**
 * @file performance.js
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {

    var _ = require('underscore');
    var fc = require('fc-core');
    var logger = require('./logger');
    var config = require('./config');

    var prefix = 'performance';
    var finishTag = 'finish';

    var itemMap = {};

    /**
     * 计算性能
     * @param {string} itemKey 监控项名
     * @return {Object} exports 返回模块自身，供链式调用
     */
    exports.measure = function (itemKey) {
        if ('string' !== typeof itemKey) {
            return;
        }
        var item = itemMap[itemKey];
        if (!item || item.process.length === 0) {
            return;
        }

        var performanceData = {};
        _.each(item.process, function (process) {
            var markName = prefix + '_' + itemKey + '_' + process;
            window.performance.measure(itemKey, config.firstMark, markName);
            var measure = [].slice.call(
                window.performance.getEntriesByName(itemKey),
                0
            ).pop();
            performanceData[markName] = measure.duration;
        });
        var measure = [].slice.call(
            window.performance.getEntriesByName(itemKey),
            0
        ).pop();
        performanceData[prefix + '_' + itemKey] = measure.duration;

        // clear marks
        _.each(item.process, function (process) {
            var markName = prefix + '_' + itemKey + '_' + process;
            window.performance.clearMarks(markName);
        });
        window.performance.clearMeasures(itemKey);

        // clear cached mark info
        delete itemMap[itemKey];

        // send performance log
        logger.log(performanceData, prefix + '_' + itemKey);
        return exports;
    };

    /**
     * 性能埋点
     * @param {string} itemKey 监控项名
     * @param {string} process 进度名
     *  为finish时表示该流程结束，开始计算性能
     * @return {Object} exports 返回模块自身，供链式调用
     */
    exports.mark = function (itemKey, process) {
        if ('string' !== typeof itemKey) {
            return;
        }
        itemMap[itemKey] = itemMap[itemKey] || {};
        var item = itemMap[itemKey];
        item.process = item.process || [];

        if ('string' !== typeof process
            || '' === process) {
            process = 'process';
        }
        if (process === finishTag) {
            fc.setImmediate(function () {
                exports.measure(itemKey);
            });
        }
        process += '_' + item.process.length;
        item.process.push(process);
        var markName = prefix + '_' + itemKey + '_' + process;
        window.performance.mark(markName);
        return exports;
    };

    return module.exports = exports;
});
