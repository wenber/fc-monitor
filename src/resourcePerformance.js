/**
 * @file
 * @author Leo Wang(wangkemiao@baidu.com)
 */

define(function (require) {
    var browserInfo = require('../context/browser');
    var moment = require('moment');

    var exports = {};

    exports.dump = function () {

        // 高级浏览器下是能够近似的获取静态资源加载状况的，包括是否走了缓存
        // 利用performance特性
        var client = browserInfo.getBrowser();
        var version = browserInfo.getBrowserVersion();

        // 低版本的getEntries方法可能不存在，或者换名
        var getEntries = window.performance.getEntries
            || window.performance.mozGetEntries
            || window.performance.msGetEntries
            || window.performance.oGetEntries
            || window.performance.webkitGetEntries;

        // 不存在这个类或方法，没必要继续了
        if (!window.PerformanceResourceTiming || !getEntries) {
            return;
        }

        var list = window.performance.getEntries();
        if (list.length === 0) {
            return;
        }

        var resourceList = [];
        for (var i = 0, l = list.length; i < l; i++) {
            if (list[i] instanceof window.PerformanceResourceTiming
                && /\/nirvana\/(src|asset)\/(initer|main)\.js\?v=/g.test(list[i].name)) {
                resourceList.push(list[i]);
            }
        }

        if (!resourceList.length) {
            return;
        }

        // 只看两个file
        // 任何一个无缓存，就认为是无缓存
        var isCached = true;
        for (var j = 0, l = resourceList.length; j < l; j++) {
            if (resourceList[j].connectStart !== resourceList[j].fetchStart) {
                isCached = false;
                break;
            }
        }

        var staticData = require('../storage/memory').getItem(
            'performance_static'
        );

        require('./logger').log({
            target: 'performance_resource_cached',
            isCached: isCached,
            detail: resourceList,
            clientTime: moment(new Date()).format('YYYY-MM-DD HH:mm:ss,SSS'),
            serverTime: moment(require('../context/envData').getItem(
                'userInfo'
            ).serverTime * 1000).format('YYYY-MM-DD HH:mm:ss,SSS'),
            browserData: browserInfo.getBrowserData(),
            staticData: {
                css_loaded: staticData.performance_static_css_loaded,
                js_sync_loaded: staticData.performance_static_js_sync_loaded,
                js_async_loaded: staticData.performance_static_js_async_loaded
            }
        });

    };

    return exports;
});
