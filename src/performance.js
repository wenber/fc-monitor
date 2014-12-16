/**
 * @file performance.js
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {

    var _ = require('underscore');
    var fc = require('fc-core');
    var logger = require('./logger');
    var config = require('./config');

    var systemData = {
        eventId: fc.util.guid()
    };
    var prefix = 'performance';
    var startTag = 'start';
    var finishTag = 'finish';

    var systemKeys = [
        'performance_static_html_parse',
        'performance_static_css_loaded',
        'performance_static_js_sync_loaded',
        'performance_static_js_async_loaded',
//        'performance_static_basicInfo_start',
//        'performance_static_basicInfo_finish',
        'performance_static_er_inited'
    ];

    var itemMap = {};

    /**
     * 计算性能
     * @param {string} itemKey 监控项名
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

        // send performance log
        logger.log(performanceData, prefix + '_' + itemKey);
    };

    /**
     * 性能埋点
     * @param {string} itemKey 监控项名
     * @param {string} process 进度名
     *  为finish时表示该流程结束，开始计算性能
     */
    exports.mark = function (itemKey, process) {
        if ('string' !== typeof itemKey) {
            return;
        }
        itemMap[itemKey] = itemMap[itemKey] || {};
        var item = itemMap[itemKey];
        item.process = item.process || [];
        switch (process) {
            case finishTag:
                fc.setImmediate(function () {
                    exports.measure(itemKey);
                });
                break;
            case undefined:
                process = 'process' + item.process.length;
                break;
            default:
                if ('string' !== typeof process) {
                    process = 'process' + item.process.length;
                }
                break;
        }
        item.process.push(process);
        var markName = prefix + '_' + itemKey + '_' + process;
        window.performance.mark(markName);
    };

    // TODO(liangjinping@baidu.com) 暂时还没考虑好怎么处理fc-monitor加载前的mark
    // 点，先留着这个方法
    exports.dumpSystem = function () {
        var current;
        var start = window.performance.getEntriesByName(
            'performance_static_html_parse'
        )[0].startTime;
        for (var i = 0, l = systemKeys.length; i < l; i++) {
            current = window.performance.getEntriesByName(systemKeys[i]);
            if (current.length > 0) {
                current = current[current.length - 1];
                systemData[current.name] = (
                    current.startTime - start
                ).toFixed(2);
            }
        }
        window.performance.measure(
            'performance_static',
            'performance_static_html_parse',
            'performance_static_er_inited'
        );
        current = window.performance.getEntriesByName('performance_static')[0];
        systemData['performance_static'] = current.duration.toFixed(2);

        var toSend = _.extend({
            'performance_static_html_parse_start_time': start,
            'target': 'performance_static'
        }, systemData);

        // 如果已经支持了HTML5的performance特性
        if (window.performance.timing) {
            _.extend(
                toSend,
                window.performance.timing.toJSON
                    ? window.performance.timing.toJSON()
                    : window.performance.timing
            );
        }

        require('./logger').log(toSend);

        return exports;
    };

    return exports;
});
