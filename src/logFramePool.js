/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file logFramePool logFrame池
 * @description 用于跨域发送日志的iframe池
 *     提供以下方法
 *     - getInstance        exports.getInstance()
 *         获取实例，返回值为Promise对象
 *     - releaseInstance    exports.releaseInstance()
 *         释放实例
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    var _ = require('underscore');
    var fc = require('fc-core');
    var Promise = require('fc-core/Promise');
    var EventTarget = require('mini-event/EventTarget');
    var config = require('./config');

    /**
     * logFrmae等待池
     * @type {Array.<LogFrame>}
     */
    var stayingPool = [];

    /**
     * logFrame工作池
     * @type {Array.<LogFrame>}
     */
    var workingPool = [];

    /**
     * iframe加载完之后的处理方法
     * 会重置iframe的src保证iframe当前是同域的
     * @event logsended
     */
    function onLoadHandler() {
        var me = this;
        me.fire('logsended');
        me.iframe.onload = function () {
            me.iframe.onload = _.bind(onLoadHandler, me);
            try {
                me.ifrw = me.iframe.contentWindow || me.iframe;
                me.ifrd = me.ifrw.document;
            }
            catch (err) {}
        };
        me.iframe.src = 'about:blank';
    }

    var logFrameProro = {
        /**
         * LogFrame，用于跨域发送log数据的iframe
         * @constructor
         */
        constructor: function () {
            var me = this;
            me.id = fc.util.uid();
            me.iframe = window.document.createElement('iframe');
            me.iframe.id = me.id;
            me.iframe.style.display = 'none';
            try {
                window.document.getElementsByTagName('body')[0].appendChild(me.iframe);
                me.ifrw = me.iframe.contentWindow || me.iframe;
                me.ifrd = me.ifrw.document;
            }
            catch (err) {}
            me.iframe.onload = _.bind(onLoadHandler, me);
        },

        /**
         * 发送数据
         * @param {string} path 请求地址
         * @param {Object} params 请求参数
         */
        send: function (path, params) {
            var me = this;
            var form = me.ifrd.createElement('form');
            form.action = path;
            form.method = 'POST';
            _.each(params, function (value, key) {
                var val = JSON.stringify(value);
                var input = me.ifrd.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = encodeURIComponent(val);
                form.appendChild(input);
            });
            me.ifrd.getElementsByTagName('body')[0].appendChild(form);
            form.submit();
        }
    };

    /**
     * LogFrame，用于跨域发送log数据的iframe
     */
    var LogFrame = fc.oo.derive(EventTarget, logFrameProro);

    /**
     * 获取实例
     * @return {Promise} 异步执行结果
     */
    exports.getInstance = function () {
        var instance = stayingPool.pop();
        if (instance) {
            workingPool.push(instance);
            return Promise.resolve(instance);
        }
        // 实际使用实例小于池大小
        else if (workingPool.length < config.logFramePoolSize) {
            instance = new LogFrame();
            stayingPool.push(instance);
            return exports.getInstance();
        }
        // 等待一定时间之后再尝试获取
        return new Promise(_.debounce(function (resolve, reject) {
            resolve(exports.getInstance());
        }, config.logFramePoolWaittingTime));
    };

    /**
     * 释放实例
     * @param {string|LogFrame} target 实例或实例id
     */
    exports.releaseInstance = function (target) {
        if ('string' === target) {
            target = _.findWhere(workingPool, {id: target});
        }
        if (target && target instanceof LogFrame) {
            var idx = _.indexOf(workingPool, target);
            _.detach(workingPool, idx);
            stayingPool.push(target);
        }
    };

    EventTarget.enable(exports);
});
