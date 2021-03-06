/**
 * @file manipulation.js
 * @description 提供性能监控的常用方法
 *     提供以下方法:
 *     - mark: function (itemKey, process) {}
 *         针对统计项${itemKey}，标记一个点
 *     - measure: function (itemKey) {}
 *         根据已有的对${itemKey}的标记，计算统计项${itemKey}的性能
 * @author Pride Leong(liangjinping@baidu.com)
 */

define(function (require, exports) {
    var core = require('./core');
    var config = require('../config');

    /**
     * 计算性能，用于非首页
     * @param {string} itemKey 监控项名
     * @return {Function}
     */
    exports.measure = function (itemKey) {
        return core.measure(itemKey, [], 'manipulation');
    };

    /**
     * 性能埋点
     * @param {string} itemKey 监控项名
     * @param {string} process 进度别名，如果不传则使用'process'
     * @return {Function}
     */
    exports.mark = function (itemKey, process) {
        return core.mark(itemKey, process, 'manipulation');
    }
});
