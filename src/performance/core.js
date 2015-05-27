/**
 * @file core.js
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
    var logger = require('../logger');
    var config = require('../config');
    var recorder = require('../recorder');
    var timeline = require('../performance/timeline');
    var memory = require('fc-storage/memory');

    /**
     * 缓存统计项
     * 标记(mark)过的点先缓存起来
     * 计算(measure)之后会清除
     * manipulation: 业务逻辑的命令空间
     * performance: 首页的命名空间
     * @type {Object}
     */
    var itemMap = {
        'manipulation': {},
        'performance': {}
    };

    /**
     * target前缀，所有性能埋点的target前缀
     * @type {string}
     */
    var prefix = config.performanceTargetPrefix;

    /**
     * 计算性能
     * @param {string} itemKey 监控项名
     * @param {Array} assistMark 辅助记录的点
     * @param {string} type 缓存对象类型
     * @return {Object} statis 返回计算后的数据
     */
    exports.measure = function (itemKey, assistMark, type) {
        if ('string' !== typeof itemKey) {
            return;
        }
        var item = itemMap[type][itemKey];
        if (!item || item.process.length === 0) {
            return;
        }
        var markNames = _.map(item.process, function (process) {
            return prefix + itemKey + '_' + process;
        });
        var performanceData = {};
        var measureList = _.chain(timeline.measure(
            assistMark.concat(markNames)
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
        delete itemMap[type][itemKey];

        var toSend = _.extend(
            {
                performanceId: config.performanceId,
                pageStabled: recorder.stable ? 1 : 0
            },
            performanceData
        );

        if (recorder.pageInactived) {
            toSend.pageInactived = recorder.pageInactived;
            toSend.inactivedDuration = recorder.inactivedDuration;
        }

        // send performance log
        logger.log(
            toSend,
            prefix + itemKey
        );
        return statis;
    };

    /**
     * 性能埋点
     * @param {string} itemKey 监控项名
     * @param {string} process 进度别名，如果不传则使用'process'
     * @param {string} type 缓存对象类型
     * @return {Object} exports 返回模块自身，供链式调用
     */
    exports.mark = function (itemKey, process, type) {
        if ('string' !== typeof itemKey) {
            return;
        }
        itemMap[type][itemKey] = itemMap[type][itemKey] || {};
        var item = itemMap[type][itemKey];
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
