/**
 * @file config.js configuration of monitor
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');

    var exports = {
        loghost: '/nirvana/log/fclogimg.gif',
        threshold: 20,
        storageKey: 'fc-monitor-storage-key',
        performanceTargetPrefix: 'performance_',
        defaultMethod: 'loghost',
        config: function (config) {
            _.extend(exports, config);
        }
    }
    return exports;
});
