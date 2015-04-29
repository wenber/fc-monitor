/**
 * @file config.js configuration of monitor
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');
    var fc = require('fc-core');
    var Enum = require('fc-core/Enum');

    exports = {
        logType: new Enum(
            {alias: 'ajax', text: '异步请求日志', value: 0x00},
            {alias: 'behavior', text: '行为日志', value: 0x01},
            {alias: 'business', text: '业务日志', value: 0x02},
            {alias: 'custom', text: '自定义日志', value: 0x03},
            {alias: 'debug', text: '调试日志', value: 0x04},
            {alias: 'performance', text: '性能日志', value: 0x05},
            {alias: 'trace', text: '跟踪日志', value: 0x06}
        ),
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
         * 跨域iframe池大小
         */
        logFramePoolSize: 10,

        /**
         * 等待时间
         */
        logFramePoolWaittingTime: 1000,

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
         * 监控日志版本
         * @type {string}
         */
        logVersion: null,

        /**
         * ajax log configuration
         * @type {Object}
         */
        ajax: require('./config/ajax'),

        /**
         * behavior log configuration
         * @type {Object}
         */
        behavior: require('./config/behavior'),

        /**
         * business log configuration
         * @type {Object}
         */
        business: require('./config/business'),

        /**
         * custom log configuration
         * @type {Object}
         */
        custom: require('./config/custom'),

        /**
         * debug log configuration
         * @type {Object}
         */
        debug: require('./config/debug'),

        /**
         * performance log configuration
         * @type {Object}
         */
        performance: require('./config/performance'),

        /**
         * trace log configuration
         * @type {Object}
         */
        trace: require('./config/trace'),

        /**
         * Setup configuration
         * @param {key=} key config field
         * @param {Object} config configuration
         * @return {Object} exports
         */
        config: function (key, config) {
            if (_.isString(key)) {
                _.each([].slice.call(arguments, 1), function (conf) {
                    var wrap = {};
                    wrap[key] = conf;
                    _.deepExtend(exports, wrap);
                });
            }
            else if (_.isObject(key)) {
                _.each([].slice.call(arguments, 0), function (conf) {
                    _.deepExtend(exports, conf);
                });
            }
            return exports;
        }
    };
    module.exports = exports;
});
