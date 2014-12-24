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
        loghost: '/nirvana/log/fclogimg.gif',

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
         * Token
         * @type {string}
         */
        token: fc.util.guid(),

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
