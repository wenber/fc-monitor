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
    var recorder = require('../recorder');
    var logger = require('../logger');

    exports.measure = function () {
        var watchPatternList = config.resourceWatchingList || [];
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
                        case '[object String]':
                            return patt === resource.name;
                        default:
                            return false;
                    }
                });
            }
        );
        // 没有资源在监控范围内时不处理
        if (list.length === 0) {
            return;
        }

        // 全部资源都命中缓存时才认为缓存命中
        var isCached = _.every(list, function (item) {
            return item.connectStart === item.fetchStart;
        });

        // 缓存计算过的性能，以备不时之需
        memory.updateItem(config.storageKey, {
            performance: {
                resource: {
                    measure: list
                }
            }
        });

        var item = memory.getItem(config.storageKey);
        var staticItem = item && item.performance && item.performance.static;
        var staticData = staticItem && staticItem.data;
        var toSend = {
            target: 'performance_resource_cached',
            isCached: isCached,
            performanceId: config.performanceId,
            detail: list,
            browserData: browser.getBrowserData(),
            staticData: staticData.log,
            pageStabled: recorder.stable ? 1 : 0
        };
        if (recorder.pageInactived) {
            toSend.pageInactived = recorder.pageInactived;
            toSend.inactivedDuration = recorder.inactivedDuration;
        }
        logger.log(toSend);
        return exports;
    };

    return module.exports = exports;
});
