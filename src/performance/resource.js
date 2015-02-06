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
                        case '[object string]':
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
        logger.log({
            target: 'performance_resource_cached',
            isCached: isCached,
            performanceId: config.performanceId,
            detail: list,
            browserData: browser.getBrowserData(),
            staticData: staticData.log
            // TODO(liangjinping@baidu.com) 将下面的数据放到业务收集发送
            // clientTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss,SSS'),
            // serverTime: moment(require('../context/envData').getItem(
            //     'userInfo'
            // ).serverTime * 1000).format('YYYY-MM-DD HH:mm:ss,SSS'),
        });
        return exports;
    };

    return module.exports = exports;
});
