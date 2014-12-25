/**
 * @file config.js configuration of monitor
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');
    var fc = require('fc-core');

    exports = {
        /**
         * The first mark-name of performance
         * @type {string}
         */
        firstMark: 'performance_static_html_parse',

        /**
         * Log url for method loghost
         * @type {string}
         */
        loghost: '/logger.gif',

        /**
         * Threshold of log queue
         * @type {number}
         */
        threshold: 20,

        /**
         * Item key of storage
         * @type {string}
         */
        storageKey: 'fc-monitor-storage-key',

        /**
         * Target prefix of performance log
         * @type {string}
         */
        performanceTargetPrefix: 'performance_',

        /**
         * Default method of sending log data
         * @type {string}
         */
        defaultMethod: 'loghost',

        /**
         * Id
         * @type {string}
         */
        performanceId: fc.util.guid(),

        /**
         * Ajax日志池大小
         * @type {string}
         */
        ajaxRecordPoolSize: 20,

        /**
         * 时间线埋点名
         * @type {Array.<string>}
         */
        timelineMarks: null,

        /**
         * 静态资源埋点名
         * @type {Array.<string>}
         */
        staticMarks: null,

        /**
         * 需要监控的资源列表匹配规则
         * @type {Array.<string|RegExp>}
         */
        resourceWatchingList: null,

        /**
         * Setup configuration
         * @param {Object} config configuration
         * @return {Object} exports
         */
        config: function (config) {
            return _.extend(exports, config);
        }
    };
    return module.exports = exports;

});
