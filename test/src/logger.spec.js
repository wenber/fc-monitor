/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file logger spec
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    /* eslint-disable max-nested-callbacks */
    var recorder = require('fc-monitor/recorder');
    var config = require('fc-monitor/config');
    var logger = require('fc-monitor/logger');
    var _ = require('underscore');
    describe('logger\'s spec', function () {
        var originalTimeout;
        var context = {
            userid: 2333333,
            optid: 2333333,
            ulevelid: 39,
            token: 'ncl20c2ijk'
        };
        var defaultConf = {
            threshold: 10,
            custom: {
                threshold: 10
            },
            logVersion: '3.0',
            loghost: '/nirvana/log/fclogimg.gif',
            defaultMethod: 'loghost'
        };
        var itemKey = context.userid + '-' + context.optid;
        beforeEach(function () {
            recorder.init(context);
            config.config(defaultConf);
            _.each(logger._debugLogData(), function (queue) {
                queue.length = 0;
            });
            require('fc-storage/localStorage').setItem(config.storageKey, {});
            window.performance.clearMarks();
            window.performance.clearMeasures();
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });
        afterEach(function () {
            recorder.init(context);
            config.config(defaultConf);
            _.each(logger._debugLogData(), function (queue) {
                queue.length = 0;
            });
            require('fc-storage/localStorage').setItem(config.storageKey, {});
            window.performance.clearMarks();
            window.performance.clearMeasures();
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });
        it('logger.log log, push a log to queue', function () {
            logger.log({
                target: 'hello'
            });
            var logQueue = logger._debugLogData();
            expect(logQueue.custom.length).toBe(1);
            expect(logQueue.custom[0].target).toBe('hello');
            // 打10个log达到阈值触发一次dump
            _.times(10, function (i) {
                logger.log({}, 'testlog' + i);
            });
            expect(logQueue.custom.length).toBe(1);
        });

        // 打log的时候会检查有没有log在localStorage中，有则取出来
        it('logger.log get log from localStorage', function () {
            var storage = require('fc-monitor/storage');
            storage.updateQueue('custom', [
                {target: 'c1'},
                {target: 'c2'},
                {target: 'c3'}
            ]);
            storage.updateQueue('debug', [
                {target: 'd1'},
                {target: 'd2'},
                {target: 'd3'}
            ]);
            var logQueue = logger._debugLogData();
            var item = require('fc-storage/localStorage').getItem(config.storageKey);
            expect(item[itemKey].queue.custom.length).toBe(3);
            expect(item[itemKey].queue.debug.length).toBe(3);
            expect(logQueue.custom.length).toBe(0);
            expect(logQueue.debug.length).toBe(0);

            logger.log({}, 'c4');
            item = require('fc-storage/localStorage').getItem(config.storageKey);
            expect(item[itemKey].queue.custom.length).toBe(0);
            // 只是取了custom的，debug的还在localStorage中
            expect(item[itemKey].queue.debug.length).toBe(3);
            expect(logQueue.custom.length).toBe(4);
            expect(logQueue.custom[0].target).toBe('c1');
            expect(logQueue.custom[3].target).toBe('c4');
            expect(logQueue.debug.length).toBe(0);

            logger.logWithType({}, 'debug', 'd5');
            item = require('fc-storage/localStorage').getItem(config.storageKey);
            // localStorage清空了
            expect(item[itemKey].queue.custom.length).toBe(0);
            expect(item[itemKey].queue.debug.length).toBe(0);
            expect(logQueue.custom.length).toBe(4);
            expect(logQueue.debug[0].target).toBe('d1');
            expect(logQueue.debug[3].target).toBe('d5');
        });

        it('logger.logWithType, push a log to specify type queue', function () {
            var logQueue = logger._debugLogData();
            logger.logWithType({}, 'debug', 'hello');
            expect(logQueue.debug.length).toBe(1);
            expect(logQueue.debug[0].target).toBe('hello');
            logger.logWithType({}, 'trace', 'hello2');
            expect(logQueue.debug.length).toBe(1);
            expect(logQueue.trace.length).toBe(1);
            expect(logQueue.trace[0].target).toBe('hello2');
        });

        it('logger.dump, dump log to loghost|console|local', function () {
            config.config({
                defaultMethod: 'loghost'
            });
            var logQueue = logger._debugLogData();
            logger.log({});
            logger.logWithType({}, 'debug', 't1');
            logger.logWithType({}, 'trace', 't2');
            expect(logQueue.custom.length).toBe(1);
            expect(logQueue.debug.length).toBe(1);
            expect(logQueue.trace.length).toBe(1);
            logger.dump({type: 'custom'});
            expect(logQueue.custom.length).toBe(0);
            expect(logQueue.debug.length).toBe(1);
            expect(logQueue.trace.length).toBe(1);
            logger.dump();
            expect(logQueue.custom.length).toBe(0);
            expect(logQueue.debug.length).toBe(0);
            expect(logQueue.trace.length).toBe(0);
        });

        it('logger.dump, dump log with specify method', function () {
            var loghostCounter = 0;
            var consoleCounter = 0;
            var localCounter = 0;
            var origLoghostFunc = logger.dumpMethod.loghost;
            var origConsoleFunc = logger.dumpMethod.console;
            var origLocalFunc = logger.dumpMethod.local;
            logger.dumpMethod.loghost = function () {
                loghostCounter++;
            };
            logger.dumpMethod.console = function () {
                consoleCounter++;
            };
            logger.dumpMethod.local = function () {
                localCounter++;
            };
            expect(loghostCounter).toBe(0);
            expect(consoleCounter).toBe(0);
            expect(localCounter).toBe(0);

            logger.log({}, 'c1');
            logger.logWithType({}, 'debug', 'd1');
            logger.logWithType({}, 'trace', 't1');
            // 只dump custom的log，方式是配置的`loghost`
            logger.dump({type: 'custom'});
            expect(loghostCounter).toBe(1);
            expect(consoleCounter).toBe(0);
            expect(localCounter).toBe(0);

            logger.dump();
            expect(loghostCounter).toBe(3);
            expect(consoleCounter).toBe(0);
            expect(localCounter).toBe(0);

            logger.log({}, 'c2');
            logger.logWithType({}, 'debug', 'd2');
            logger.logWithType({}, 'trace', 't2');
            // 只dump一个(custom)
            logger.dump({method: 'console', type: 'custom'});
            expect(loghostCounter).toBe(3);
            expect(consoleCounter).toBe(1);
            expect(localCounter).toBe(0);

            logger.log({}, 'c3');
            logger.logWithType({}, 'debug', 'd3');
            logger.logWithType({}, 'trace', 't3');
            // 所有log都dump到控制台
            logger.dump({method: 'console'});
            expect(loghostCounter).toBe(3);
            expect(consoleCounter).toBe(4);
            expect(localCounter).toBe(0);

            logger.log({}, 'c4');
            logger.logWithType({}, 'debug', 'd4');
            logger.logWithType({}, 'trace', 't4');
            // trace的dump到localStorage
            // custom的dump到console
            // debug的dump到loghost
            logger.dump({
                method: 'local',
                custom: {
                    method: 'console'
                },
                debug: {
                    method: 'loghost'
                }
            });
            expect(loghostCounter).toBe(4);
            expect(consoleCounter).toBe(5);
            expect(localCounter).toBe(1);

            // 恢复
            logger.dumpMethod.loghost = origLoghostFunc;
            logger.dumpMethod.console = origConsoleFunc;
            logger.dumpMethod.local = origLocalFunc;
        });

        it('logger.dump, dump log to localStorage', function () {
            var logQueue = logger._debugLogData();
            require('fc-monitor/storage').updateQueue('debug', []);
            require('fc-monitor/storage').updateQueue('trace', []);
            var item = require('fc-storage/localStorage').getItem(config.storageKey);
            expect(logQueue.debug.length).toBe(0);
            expect(item[itemKey].queue.debug.length).toBe(0);
            expect(logQueue.trace.length).toBe(0);
            expect(item[itemKey].queue.trace.length).toBe(0);

            logger.logWithType({}, 'debug', 'd1');
            logger.logWithType({}, 'debug', 'd2');
            logger.logWithType({}, 'trace', 't1');
            item = require('fc-storage/localStorage').getItem(config.storageKey);
            expect(logQueue.debug.length).toBe(2);
            expect(item[itemKey].queue.debug.length).toBe(0);
            expect(logQueue.trace.length).toBe(1);
            expect(item[itemKey].queue.trace.length).toBe(0);
            logger.dump({method: 'local'});
            item = require('fc-storage/localStorage').getItem(config.storageKey);
            expect(logQueue.debug.length).toBe(0);
            expect(item[itemKey].queue.debug.length).toBe(2);
            expect(logQueue.trace.length).toBe(0);
            expect(item[itemKey].queue.trace.length).toBe(1);
            expect(item[itemKey].queue.debug[0].target).toBe('d1');
            expect(item[itemKey].queue.debug[1].target).toBe('d2');
            expect(item[itemKey].queue.trace[0].target).toBe('t1');

            logger.logWithType({}, 'debug', 'd3');
            logger.logWithType({}, 'trace', 't2');
            logger.logWithType({}, 'trace', 't3');
            logger.logWithType({}, 'trace', 't4');
            item = require('fc-storage/localStorage').getItem(config.storageKey);
            // log的时候会从localStorage中取出先前的log
            expect(logQueue.debug.length).toBe(3);
            expect(item[itemKey].queue.debug.length).toBe(0);
            expect(logQueue.trace.length).toBe(4);
            expect(item[itemKey].queue.trace.length).toBe(0);
            expect(logQueue.debug[0].target).toBe('d1');
            expect(logQueue.debug[2].target).toBe('d3');
            expect(logQueue.trace[0].target).toBe('t1');
            expect(logQueue.trace[3].target).toBe('t4');
            logger.dump({method: 'local'});
            item = require('fc-storage/localStorage').getItem(config.storageKey);
            expect(logQueue.debug.length).toBe(0);
            expect(item[itemKey].queue.debug.length).toBe(3);
            expect(logQueue.trace.length).toBe(0);
            expect(item[itemKey].queue.trace.length).toBe(4);

            logger.dump();
            item = require('fc-storage/localStorage').getItem(config.storageKey);
            expect(logQueue.debug.length).toBe(0);
            expect(item[itemKey].queue.debug.length).toBe(0);
            expect(logQueue.trace.length).toBe(0);
            expect(item[itemKey].queue.trace.length).toBe(0);
        });
    });
});
