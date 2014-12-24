/**
 * @file Provide the util to monitor the ajax latency.
 *
 * @author: Chong Chen(chenchong02@baidu.com)
 */

define(function(require) {
    'use strict';

    var config = require('../config');

    /**
     * The fc-core to supply tools for ajaxLogger.
     *
     * @type {Object}
     */
    var browser = require('fc-core/browser');

    /**
     * The logger object to send the real ajax log.
     *
     * @type {Object}
     */
    var logger = require('../logger');

    /**
     * The index of a new ajax log. We use it to retrieve the ajax
     * log content from the cache.
     *
     * @type {number}
     */
    var ajaxRecordIndex = 0;

    /**
     * The started time when the ajax request is registered in this logger.
     *
     * @type {Array.<Object>}
     */
    var ajaxRecordStartTime = [];

    /**
     * The cached content pool of the ajax log content. To reduce the request
     * count, we bundle every 20 ajax log requests together to a single real
     * logger request.
     *
     * @type {Array.<string>}
     */
    var ajaxRecordPool = [];

    /**
     * The exported object.
     */
    var ajaxLogger = {};

    /**
     * Mark an ajax path as a record. This will record the time when the
     * ajax request is sent. It returns a stub in number to represent the
     * request.
     *
     * @param {string} ajaxPath The path of the ajax.
     * @return {number} The stub of the request.
     */
    ajaxLogger.mark = function(ajaxPath) {
        var idx = ajaxRecordIndex++;
        ajaxRecordStartTime[idx] = {
            path: ajaxPath,
            time: new Date()
        };
        return idx;
    };

    /**
     * Sends log for the ajax.
     *
     * @param {number} idx The index of the ajax request in the cache,
     *     returned by ajaxMark.
     * @param {?string} eventId The unique id for operation.
     * @param {?Array} timestamps The timestamp of the event, in array of
     *     [['t1-t0', t1], ['t2-t1', t2]]. It will be used to calculated and
     *     log the ellapses, where t1 and t2 are numbers.
     * @param {?string} reqid The id for ajax request.
     * @return {string} The log content for ajax.
     */
    ajaxLogger.log = function(idx, eventId, timestamps, reqid) {
        var record = ajaxRecordStartTime[idx];
        if (!record) {
            return;
        }
        var logContent = [record.path];
        logContent.push('eventId:' + (eventId ? eventId : ''));
        logContent.push('reqid:' + (reqid ? reqid : ''));
        if (timestamps && timestamps.length > 0) {
            var t = record.time;
            for (var data, i = 0; data = timestamps[i++];) {
                logContent.push(data[0] + ':' + (data[1] - t));
                t = data[1];
            }
        }

        ajaxRecordPool.push(logContent.join(';'));
        ajaxRecordStartTime[idx] = null;
        if (ajaxRecordPool.length > config.ajaxRecordPoolSize) {
            return ajaxLogger.dump();
        }
    };

    /**
     * Dumps all the data to the server.
     * @return {string} The log content for ajax.
     */
    ajaxLogger.dump = function() {
        var ajaxLogParams = {
            nav: browser.getUserAgent(),
            ajaxRecord: ajaxRecordPool.join('|')
        };
        var content = logger.log(
            ajaxLogParams, 'ajaxLog', true  /* only use basic params */);
        ajaxRecordPool = [];
        return content;
    };

    return ajaxLogger;
});
