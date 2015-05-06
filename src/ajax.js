/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file ajax.js
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    var logger = require('./logger');
    var util = require('./util');

    /**
     * 测量ajax性能及监控
     * @param {AjaxRequest} ajaxRequest ajax请求实例
     * @param {Object} response ajax返回结果
     * @param {boolean} isFail 是否是失败状态
     */
    exports.measure = function (ajaxRequest, response, isFail) {
        var reqid = ajaxRequest.option.data.reqId;
        util.mark(reqid + '-end');
        var measure = util.measure(reqid, reqid + '-begin', reqid + '-end');
        exports.log({
            requestContent: ajaxRequest.option.data,
            spent: measure.duration,
            status: response.status || 200,
            httpStatus: response.httpStatus || 200
        }, 'ajaxInfo');
        if (isFail) {
            exports.log({
                requestContent: ajaxRequest.option.data,
                responseContent: response,
                spent: measure.duration,
                status: response.status || 200,
                httpStatus: response.httpStatus || 200
            }, 'ajaxFail');
        }
        util.clearMarks(reqid + '-begin');
        util.clearMarks(reqid + '-end');
    };

    /**
     * 标记ajax开始
     * @param {AjaxRequest} ajaxRequest ajax请求实例
     */
    exports.mark = function (ajaxRequest) {
        var reqid = ajaxRequest.option.data.reqId;
        util.mark(reqid + '-begin');
    };

    /**
     * 记录数据
     * @param {Object} data 监控数据
     * @param {string} target 监控target
     */
    exports.log = function (data, target) {
        logger.logWithType(data, 'ajax', target);
    };
});
