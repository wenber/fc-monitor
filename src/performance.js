/**
 * @file performance.js
 * @description 提供性能监控的常用方法
 *     提供以下方法:
 *     - mark: function (itemKey, process) {}
 *         针对统计项${itemKey}，标记一个点
 *     - measure: function (itemKey) {}
 *         根据已有的对${itemKey}的标记，计算统计项${itemKey}的性能
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports) {

    var _ = require('underscore');
    var logger = require('./logger');
    var config = require('./config');
    var recorder = require('./recorder');
    var timeline = require('./performance/timeline');
    var memory = require('fc-storage/memory');

    /**
     * target前缀，所有性能埋点的target前缀
     * @type {string}
     */
    var prefix = config.performanceTargetPrefix;

    /**
     * 缓存统计项
     * 标记(mark)过的点先缓存起来
     * 计算(measure)之后会清除
     *
     * @type {Object}
     */
    var itemMap = {};

    /**
     * 计算性能
     * @param {string} itemKey 监控项名
     * @return {Object} statis 返回计算后的数据
     */
    exports.measure = function (itemKey) {
        if ('string' !== typeof itemKey) {
            return;
        }
        var item = itemMap[itemKey];
        if (!item || item.process.length === 0) {
            return;
        }
        var markNames = _.map(item.process, function (process) {
            return prefix + itemKey + '_' + process;
        });
        var performanceData = {};
        var measureList = _.chain(timeline.measure(
            [config.firstMark].concat(markNames)
        )).each(function (measure) {
            performanceData[measure.endMark] = measure.duration;
            // clear mark
            if (measure.endMark !== config.firstMark) {
                window.performance.clearMarks(measure.endMark);
            }
        }).value();
        performanceData[prefix + itemKey] = _.max(performanceData);

        var statis = {};
        statis[itemKey] = {
            measure: measureList,
            data: performanceData
        };
        memory.updateItem(config.storageKey, {
            performance: statis
        });

        // clear cached mark info
        delete itemMap[itemKey];

        // send performance log
        logger.log(
            _.extend(
                {
                    performanceId: config.performanceId,
                    pageStabled: recorder.stable ? 1 : 0
                },
                performanceData
            ),
            prefix + itemKey
        );
        return statis;
    };

    /**
     * 性能埋点
     * @param {string} itemKey 监控项名
     * @param {string} process 进度别名，如果不传则使用'process'
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
        // 加上当前长度作为后缀，保证新增markName不与已有重复
        process += '_' + item.process.length;
        item.process.push(process);
        var markName = prefix + itemKey + '_' + process;
        window.performance.mark(markName);
        return exports;
    };
});
