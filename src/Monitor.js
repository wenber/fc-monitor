/**
 * @file 日志监控
 * - 监控对象可以是类或者是对象
 * - 如果是类监控的是类的prototype对象
 * - 监控函数调用发生在业务逻辑函数调用之后；
 * - 监控逻辑不能修改业务逻辑的数据或者返回结果
 *
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require) {
    'use strict';

    var _ = require('underscore');
    var fc = require('fc-core');

    /**
     * Monitor 监控类
     * 
     * @constructor
     * @param {Object} watchList 监控列表
     */
    function Monitor(watchList) {
        this.watchList = watchList;
    }

    /**
     * inject 劫持注入callback
     *
     * @private
     * @param {string} item 属性名称
     * @param {Object} owner owner对象
     * @param {function} before 注入函数
     * @param {function} after 注入函数
     */
    function inject(item, owner, before, after) {
        fc.aop.before(owner, item, before);
        fc.aop.after(owner, item, after);
    }

    /**
     * watch 注入监控列表
     * 
     * @public
     * @param {Object} Clazz 监控类或对象
     */
    Monitor.prototype.watch = function (Clazz){
        var owner = Clazz.prototype || Clazz;
        var list = this.watchList || {};
        _.each(list, function (item, name) {
            if (list[name] && owner[name]) {
                inject(name, owner, item.before, item.after);
            }
        })
    };

    return Monitor;
});

