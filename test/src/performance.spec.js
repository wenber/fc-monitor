/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file FcMonitor performance spec
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    /* eslint-disable max-nested-callbacks */
    var logger = require('fc-monitor/logger');
    var performance = require('fc-monitor/performance');
    var timeline = require('fc-monitor/performance/timeline');
    var _ = require('underscore');
    var fc = require('fc-core');
    describe('日志发送生成与发送测试', function () {
        var config = require('fc-monitor/config');
        var recorder = require('fc-monitor/recorder');

        var originalTimeout;
        beforeEach(function () {
            // 初始化记录器
            recorder.init({
                userid: 2333333,
                optid: 2333333
            });
            // 监控配置
            config.config({
                threshold: 10,
                logVersion: '3.0',
                loghost: '/logger.gif',
                defaultMethod: 'loghost'
            });
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });

        afterEach(function () {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        it('监控配置成功', function () {
            config.config({
                threshold: 10,
                logVersion: '3.0',
                loghost: '/logger.gif',
                defaultMethod: 'console'
            });
            expect(config.logVersion).toBe('3.0');
            expect(config.threshold).toBe(10);
            expect(config.loghost).toBe('/logger.gif');
            expect(config.defaultMethod).toBe('console');
        });

        it('产成日志成功', function () {
            logger.log({}, 'test1');
            expect(logger._debugLogData().custom[0].target).toBe('test1');
            logger.log({target: 'test2'});
            expect(logger._debugLogData().custom[1].target).toBe('test2');
            expect(logger._debugLogData().custom.length).toBe(2);
        });

        it('日志成功发送到日志主机', function (done) {
            logger.log({});
            expect(logger._debugLogData().custom.length).toBe(3);
            logger.dump();
            logger.once('logsended', function () {
                done();
            });
            expect(logger._debugLogData().custom.length).toBe(0);
        });

        it('修改监控配置', function () {
            config.config({
                defaultMethod: 'console'
            });
            expect(config.defaultMethod).toBe('console');
        });

        it('日志输出到控制台成功', function () {

            config.config({
                defaultMethod: 'console'
            });
            var check = false;
            fc.aop.before(logger.dumpMethod, 'console', function () {
                check = true;
            });
            logger.log({});
            logger.dump();
            expect(check).toBe(true);
            expect(logger._debugLogData().custom.length).toBe(0);

        });
    });

    describe('性能埋点与计算测试', function () {
        it('埋点成功', function () {
            expect(window.performance.getEntriesByName('performance_a_process_0').length).toBe(0);
            performance.mark('a');
            // mark 之后会有一个PerformanceMark
            expect(window.performance.getEntriesByName('performance_a_process_0').length).toBe(1);
            performance.mark('a');
            expect(window.performance.getEntriesByName('performance_a_process_1').length).toBe(1);
            performance.mark('a', 'end');
            expect(window.performance.getEntriesByName('performance_a_end_2').length).toBe(1);
        });

        it('计算完成', function () {
            performance.measure('a');
            // 计算完之后会清理掉埋点
            expect(window.performance.getEntriesByName('performance_a_process_0').length).toBe(0);
            // 计算中产生的PerformanceMeasure会自行清理
            expect(window.performance.getEntriesByType('measure').length).toBe(0);
            // 计算之后会产生一个log
            expect(logger._debugLogData().custom.length).toBe(1);
        });

        // 测试能否同时处理多个不同的指标target
        it('交叉埋点', function () {
            performance.mark('a');
            performance.mark('b');
            performance.mark('a');
            performance.mark('b');
            var a = performance.measure('a');
            expect(a.a.measure.length).toBe(2);
            var b = performance.measure('b');
            expect(b.b.measure.length).toBe(2);
        });
    });

    describe('timeline计算测试', function () {
        var list = ['a', 'b', 'c', 'd'];
        beforeEach(function () {
            window.performance.clearMarks();
            window.performance.clearMeasures();
            _.each(list, function (name) {
                window.performance.mark(name);
            });
        });
        afterEach(function () {
            window.performance.clearMarks();
            window.performance.clearMeasures();
        });
        it('计算完成', function () {
            var measureList = timeline.measure(list);
            expect(measureList.length).toBe(list.length);
        });

        var longList = list.concat(['e', 'f', 'g']);
        it('计算不存在的埋点', function () {
            var measureList = timeline.measure(longList);
            expect(measureList.length).toBe(list.length);
        });

        it('计算结果顺序正确', function () {
            // 计算与埋点时间有关，与传入的埋点列表序无关
            var measureList = timeline.measure(_.shuffle(list));
            expect(measureList.length).toBe(list.length);
            // 顺序应是 a -> b -> c -> d
            expect(measureList[0].endMark).toBe('a');
            expect(measureList[1].endMark).toBe('b');
            expect(measureList[2].endMark).toBe('c');
            expect(measureList[3].endMark).toBe('d');

            window.performance.mark('c');
            measureList = timeline.measure(_.shuffle(list));
            // 重新mark一个c，顺序会变成a -> b -> d -> c
            expect(measureList[0].endMark).toBe('a');
            expect(measureList[1].endMark).toBe('b');
            expect(measureList[2].endMark).toBe('d');
            expect(measureList[3].endMark).toBe('c');
        });

        it('计算结果正确', function () {
            window.performance.mark('a');
            var measureList = timeline.measure(_.shuffle(list));
            // 重新mark一个a，那么在measure时会取最后一个a的埋点，
            // 所以计算出的时间区间应该是b->a
            window.performance.measure('t', 'b', 'a');
            var measure = window.performance.getEntriesByName('t').pop();
            expect(measureList.pop().duration).toBe(measure.duration);
        });
    });
});
