/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file static.js collect static performance info
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');
    var config = require('../config');
    var logger = require('../logger');
    var timeline = require('./timeline');
    var memory = require('fc-storage/memory');
    var recorder = require('../recorder');

    /**
     * 计算静态资源性能
     * @param {Array.<string>=} markNames 静态资源埋点列表
     * @return {Object} exports 返回模块自身，供链式调用
     */
    exports.measure = function (markNames) {
        var keys = markNames || config.staticMarks || [];
        var staticData = {};
        var measureList = _.chain(
            timeline.measure(keys)
        ).each(function (measure) {
            staticData[measure.endMark] = measure.duration;
        }).value();
        // 没有埋点，不用处理
        if (!measureList.length) {
            return;
        }
        var target = 'performance_static';
        var firstMark = _.first(measureList);
        staticData[target] = _.max(staticData);
        staticData[firstMark.startMark + '_start_time'] = firstMark.startTime;

        // 将静态资源的性能数据缓存在内存中，以备不时之需
        memory.updateItem(config.storageKey, {
            performance: {
                'static': {
                    measure: measureList,
                    data: staticData
                }
            }
        });

        var toSend = _.extend(
            {
                performanceId: config.performanceId,
                pageStabled: recorder.stable ? 1 : 0
            },
            staticData
        );

        // 如果已经支持了HTML5的performance特性
        if (window.performance.timing) {
            _.extend(
                toSend,
                window.performance.timing.toJSON
                    ? window.performance.timing.toJSON()
                    : window.performance.timing
            );
        }

        logger.log(toSend, target);

        return exports;
    };

    exports.dump = function () {
    };
    return module.exports = exports;
});
