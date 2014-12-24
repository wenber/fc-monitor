/**
 * @file The perforance of material manipulation
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {
    var logger = require('../logger');
    var util = require('../util');

    /**
     * Map for eventId-target
     */
    var manipulationEvent = {};

    /**
     * Prefix of log target
     * @const
     * @type {string}
     */
    var logPrefix = 'performance_';

    /**
     * Start suffix of performance mark point
     * @const
     * @type {string}
     */
    var startSuffix = '_start';

    /**
     * Finish suffix of performance mark point
     * @const
     * @type {string}
     */
    var finishSuffix = '_finish';

    /**
     * Mark a start point for synchronous manipulation.
     * @param {string} eventId
     *     manipulation eventId.
     * @param {string=} optTarget
     *     manipulation target.
     */
    exports.syncMarkStart = function (eventId, optTarget) {
        if ('string' === typeof eventId && eventId.length) {
            var startTag = eventId + startSuffix;
            window.performance.mark(startTag);
            if ('string' === typeof optTarget && optTarget.length) {
                var mark = util.getEntry(startTag);
                manipulationEvent[eventId] = {
                    target: optTarget,
                    marks: [mark]
                };
                var logData =  {
                    target: logPrefix + optTarget,
                    eventId: eventId
                };
                logData[logPrefix + optTarget + '_start'] = mark.duration;
                manipulationEvent[eventId].logData = logData;
            }
        }
    };

    /**
     * Mark a start point for asynchronous manipulation.
     * @param {string} eventId
     *     manipulation eventId.
     * @param {string=} optTarget
     *     manipulation target.
     */
    exports.asyncMarkStart = function (eventId, optTarget) {};

    /**
     * Measure the synchronous performance of material manipulation
     * @param {string} eventId
     *     manipulation eventId.
     * @param {string} markName
     *     mark name.
     */
    exports.syncMeasure = function (eventId, markName) {
        markName = markName ? markName : '';
        var startTag = eventId + startSuffix;
        if ('string' === typeof eventId && manipulationEvent[eventId]) {
            var finishTag;
            if (markName === 'finish') {
                finishTag = eventId + finishSuffix;
            }
            else {
                finishTag = eventId + '_' + markName;
            }
            window.performance.mark(finishTag);
            var mark = util.getEntry(finishTag);
            var marks = manipulationEvent[eventId].marks;
            marks.push(mark);

            window.performance.measure(eventId, startTag, finishTag);

            var measure = util.getEntry(eventId);
            var duration = measure.duration;
            var target = logPrefix + manipulationEvent[eventId].target;
            var logData = manipulationEvent[eventId].logData;
            var markKey = target + '_' + markName + '_spent';
            logData[markKey] = duration;
            if (markName === 'finish') {
                logData[target] = duration;
                logger.log(logData);
                window.performance.clearMarks(startTag);
                window.performance.clearMarks(finishTag);
                window.performance.clearMeasures(eventId);
                delete manipulationEvent[eventId];
            }
        }
        else {
            window.performance.clearMarks(startTag);
        }
    };
});
