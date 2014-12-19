/**
 * @file performance.js
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {

    var _ = require('underscore');
    var fc = require('fc-core');
    var logger = require('./logger');
    var config = require('./config');

    var staticData = {
        eventId: fc.util.guid()
    };
    var prefix = 'performance';
    var finishTag = 'finish';

    var staticKeys = [
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

        // clear cached mark info
        delete itemMap[itemKey];

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
    };

    // TODO(liangjinping@baidu.com) 暂时还没考虑好怎么处理fc-monitor加载前的mark
    // 点，先留着这个方法
    exports.dumpStatic = function () {
        var startMarkName = 'performance_static_html_parse';
        var startMark = [].slice.call(
            window.performance.getEntriesByName(startMarkName),
            0
        ).pop();
        _.each(staticKeys, function (markName) {
            try {
                window.performance.measure('static', startMarkName, markName);
                var measure = [].slice.call(
                    window.performance.getEntriesByName('static'),
                    0
                ).pop();
                staticData[markName] = measure.duration;
            }
            catch (e) {}
        });
        window.performance.clearMeasures('static');

        var target = 'performance_static';
        window.performance.measure(
            target,
            'performance_static_html_parse',
            'performance_static_er_inited'
        );
        var measure = [].slice.call(
            window.performance.getEntriesByName(target),
            0
        ).pop();
        staticData[target] = measure.duration;
        window.performance.clearMeasures(target);

        var toSend = _.extend({
            'performance_static_html_parse_start_time': startMark.startTime,
            'target': target
        }, staticData);

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
