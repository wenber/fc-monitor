/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file static.js collect static performance info
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');
    var util = require('../util');
    var config = require('../config');
    var logger = require('../logger');
    var memory = require('fc-storage/memory');
    var fc = require('fc-core');

    var staticKeys = [
        'performance_static_html_parse',
        'performance_static_css_loaded',
        'performance_static_js_sync_loaded',
        'performance_static_js_async_loaded',
        'performance_static_basicInfo_start',
        'performance_static_basicInfo_finish',
        'performance_static_er_inited'
    ];

    var staticData = {
        eventId: fc.util.guid()
    };
    var staticMeasure = [];

    /**
     * 计算静态资源性能
     * @return {Object} exports 返回模块自身，供链式调用
     */
    exports.measure = function () {
        var keys = staticKeys || [];
        _.each(keys, function (key) {
            try {
                var startMarkName = keys[0];
                window.performance.measure('static', startMarkName, key);
                var measure = util.getEntry('static');
                staticMeasure.push(measure);
                staticData[key] = measure.duration;
            }
            catch (e) {}
        });
        var target = 'performance_static';
        var measureList = _.sortBy(staticMeasure, 'duration');
        staticData[target] = _.last(measureList).duration;
        staticData[target + '_start_time'] = _.first(measureList).startTime;

        var item = {};
        item[target] = {};
        item[target].measure = staticMeasure;
        item[target].logData = staticData;
        memory.updateItem(config.storageKey, item);

        window.performance.clearMeasures('static');

        var toSend = _.extend({}, staticData);

        // 如果已经支持了HTML5的performance特性
        if (window.performance.timing) {
            _.extend(
                toSend,
                window.performance.timing.toJSON
                    ? window.performance.timing.toJSON()
                    : window.performance.timing
            );
        }

        fc.setImmediate(function () {
            logger.log(toSend, target);
        });

        return exports;
    };
    return module.exports = exports;
});
