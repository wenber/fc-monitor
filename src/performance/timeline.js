/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file timeline.js timeline性能埋点
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {

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
            var startMark = list[0];
            var entry = util.measure('timeline', startMark.name, mark.name);
            if (entry) {
                return {
                    duration: entry.duration,
                    startTime: entry.startTime,
                    endMark: mark.name,
                    startMark: startMark.name
                };
            }
            return null;
        }).filter(function (mark) {
            return !!mark;
        }).value();
        window.performance.clearMeasures('timeline');
        return measureList;
    };
    return ;
});
