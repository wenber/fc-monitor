/**
 * @file config.js configuration of monitor
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');

    var exports = {
        firstMark: 'performance_static_html_parse',
        loghost: '/nirvana/log/fclogimg.gif',
        threshold: 1,
        storageKey: 'fc-monitor-storage-key',
        performanceTargetPrefix: 'performance_',
        defaultMethod: 'loghost',
        config: function (config) {
            _.extend(exports, config);
        },
        ajaxRecordPoolSize: 2
    };

    return exports;
});
