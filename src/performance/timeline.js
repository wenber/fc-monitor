/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file timeline.js timeline性能埋点计算
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports) {

    var _ = require('underscore');
    var util = require('../util');
    var config = require('../config');

    /**
     * 计算各个mark点的性能
     * @param {Array.<string>} markNames 要计划的埋点名列表
     * @return {Array.<Object>} measureList 计算好的性能数据
     */
    exports.measure = function (markNames) {
        markNames = markNames || config.timelineMarks || [];
        var measureList = _.chain(markNames).map(function (markName) {
            return util.getEntry(markName);
        }).filter(function (mark) {
            return !!mark;
        }).sortBy('startTime').map(function (mark, idx, list) {
            var start = list[0];
            var entry = util.measure('timeline' + idx, start.name, mark.name);
            if (entry) {
                return {
                    duration: entry.duration,
                    startTime: entry.startTime,
                    endMark: mark.name,
                    startMark: start.name
                };
            }
            return null;
        }).each(function (mark, idx) {
            window.performance.clearMeasures('timeline' + idx);
        }).filter(function (mark) {
            return !!mark;
        }).value();
        return measureList;
    };
});
