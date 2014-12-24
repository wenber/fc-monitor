/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file resource.js resource log
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    'use strict';

    var _ = require('underscore');
    var util = require('../util');
    var config = require('../config');
    var memory = require('fc-storage/memory');
    var browser = require('fc-core/browser');
    var fc = require('fc-core');
    var logger = require('../logger');

    var watchPatternList = [
        /(src|asset)\/.*(initer|main).*\.js/g
    ];

    exports = {};

    exports.measure = function () {
        if (!window.PerformanceResourceTiming || !util.getEntries) {
            return;
        }
        var list = _.filter(
            util.getEntries.call(window.performance),
            function (resource) {
                if (!(resource instanceof window.PerformanceResourceTiming)) {
                    return false;
                }
                return _.some(watchPatternList, function (patt) {
                    var type = Object.prototype.toString.call(patt);
                    switch (type) {
                        case '[object RegExp]':
                            return patt.test(resource.name);
                        case '[object string]':
                            return patt === resource.name;
                        default:
                            return false;
                    }
                });
            }
        );
        if (list.length === 0) {
            return;
        }
        var isCached = _.every(list, function (item) {
            return item.connectStart === item.fetchStart;
        });
        var target = 'performance_static';
        var item = memory.getItem(config.storageKey);
        var staticData = item && item[target] && item[target].logData;

        fc.setImmediate(function () {
            logger.log({
                target: 'performance_resource_cached',
                isCached: isCached,
                token: config.token,
                detail: list,
                browserData: browser.getBrowserData(),
                staticData: staticData.log
                // TODO(liangjinping@baidu.com) 将下面的数据放到业务收集发送
                // clientTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss,SSS'),
                // serverTime: moment(require('../context/envData').getItem(
                //     'userInfo'
                // ).serverTime * 1000).format('YYYY-MM-DD HH:mm:ss,SSS'),
            });
        });
        return exports;
    };

    return module.exports = exports;
});
