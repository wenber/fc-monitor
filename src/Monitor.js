/**
 * @file 日志监控
 * - 监控对象可以是类或者是对象
 * - 如果是类监控的是类的prototype对象
 * - 监控函数调用发生在业务逻辑函数调用之后；
 * - 监控逻辑不能修改业务逻辑的数据或者返回结果
 *
 * @author Liandong Liu (liuliandong01@baidu.com)
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require) {
    'use strict';

    var _ = require('underscore');
    var fc = require('fc-core');
    var ajaxSession = require('fc-ajax/ajaxSession');
    var logBusiness = require('fc-monitor/business');

    /**
     * Monitor 监控类
     *
     * @constructor
     * @param {Object} watchList 监控列表
     */
    function Monitor(watchList) {
        this.injectConf = {};
        this.watchList = [].concat(watchList);
        this.mergeList(this.watchList);
    }

    /**
     * 合并配置
     * @param {Array.<Object>|Object} list 单个或多个监控配置
     */
    Monitor.prototype.mergeList = function (list) {
        this.injectConf = _.reduce([].concat(list), function (memo, item, idx) {
            _.each(item, function (injectMethod, methodName) {
                injectMethod = injectMethod || {};
                var confItem = memo[methodName] = memo[methodName] || {};
                confItem.before = [].concat(confItem.before, injectMethod.before || injectMethod);
                confItem.after = [].concat(confItem.after, injectMethod.after || injectMethod);
            });
            return memo;
        }, this.injectConf);
    };

    /**
     * 增加监控配置
     * @param {Array.<Object>|Object} list 单个或多个监控配置
     */
    Monitor.prototype.addList = function (list) {
        this.watchList = [].concat(this.watchList, list);
        this.mergeList(list);
    };

    /**
     * 串联合并多个方法
     * @return {Function} series 合并后的方法
     */
    function series() {
        var funcs = _.select([].slice.call(arguments, 1), _.isFunction);
        return function () {
            var ctx = this;
            var args = arguments;
            _.each(funcs, function (func) {
                func.apply(ctx, args);
            });
        };
    }

    /**
     * inject 劫持注入callback
     *
     * @private
     * @param {string} methodName 属性名称
     * @param {Object} ctx ctx对象
     * @param {Object|Array.<Function>|Function} injectMethod 要注入的方法
     * @property {Array.<Function>|Function} injectMethod.before 注入函数，执行于被注入方法之前
     * @property {Array.<Function>|Function} injectMethod.after 注入函数，执行于被注入方法之后
     */
    function inject(methodName, ctx, injectMethod) {
        if (_.isFunction(injectMethod)) {
            fc.aop.around(ctx, methodName, injectMethod);
        }
        else if (_.isArray(injectMethod)) {
            fc.aop.around(ctx, methodName, series.apply(this, [].concat(injectMethod)));
        }
        else {
            if (injectMethod && injectMethod.before) {
                fc.aop.before(ctx, methodName, series.apply(this, [].concat(injectMethod.before)));
            }
            if (injectMethod && injectMethod.after) {
                fc.aop.after(ctx, methodName, series.apply(this, [].concat(injectMethod.after)));
            }
        }
    }

    /**
     * watch 监控对象或类
     *
     * @public
     * @param {Object} Clazz 监控类或对象
     */
    Monitor.prototype.watch = function (Clazz) {
        var ctx = Clazz.prototype || Clazz;
        var conf = this.injectConf || {};
        _.each(conf, function (injectMethod, name) {
            if (conf[name] && _.isFunction(ctx[name])) {
                inject(name, ctx, injectMethod);
            }
        });
    };

    /**
     * 为eventId生成会话流标识sessionId
     * @public
     * @param {Event} event 事件对象
     * @return {string} 返回创建的sessionId
     */
    Monitor.prototype.generateSessionId = function () {
        var sessionId = ajaxSession.createSessionId();
        var eventId = logBusiness.createEventId();
        ajaxSession.session[sessionId] = eventId;
        return sessionId;
    };

    return Monitor;
});
