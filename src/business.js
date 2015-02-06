/**
 * @file business.js business of monitor
 * @author Ming Liu(liuming07@baidu.com)
 * @date 2015-01-30
 */

define(function (require, exports, module) {

    var eventId = '';

    /**
     * 生成eventId
     * @public
     * @return {string} 生成的eventId
     */
    exports.createEventId = function () {
        return eventId = require('./util').createEventId();
    };

    /**
     * 清除eventId
     * @public
     */
    exports.clearEventId = function () {
        eventId = '';
    };

    /**
     * 获得eventId
     * @public
     * @return {string} 当前的eventId
     */
    exports.getEventId = function () {
        return eventId;
    };

    /**
     * log封装函数
     * @param  {Object} params 监控字段对象
     * @param  {Object=} optTarget target字段
     * @return {string} 返回当前的eventId
     */
    exports.log = function (params, optTarget) {
        params = params || {};
        exports.createEventId();
        params.eventId = eventId;
        require('./logger').log(params, optTarget);

        return eventId;
    };

    // 进来就执行一次
    exports.createEventId();

    return module.exports = exports;
});
