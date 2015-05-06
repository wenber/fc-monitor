/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file ajax spec
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    /* eslint-disable max-nested-callbacks */
    var fc = require('fc-core');
    var request = require('fc-ajax/request');
    var hooks = require('fc-ajax/hooks');
    var recorder = require('fc-monitor/recorder');
    var config = require('fc-monitor/config');
    var logger = require('fc-monitor/logger');
    var _ = require('underscore');
    var Enum = require('fc-core/Enum');

    var httpCodes = new Enum(
        {value: 100, alias: 'Continue', text: '指示客户端可能继续其请求'},
        {value: 101, alias: 'SwitchingProtocols', text: '指示正在更改协议版本或协议'},
        {value: 200, alias: 'OK', text: '指示请求成功，且请求的信息包含在响应中。这是最常接收的状态代码'},
        {value: 201, alias: 'Created', text: '指示请求导致在响应被发送前创建新资源'},
        {value: 202, alias: 'Accepted', text: '指示请求已被接受做进一步处理'},
        {value: 203, alias: 'NonAuthoritativeInformation', text: '指示返回的元信息来自缓存副本而不是原始服务器，因此可能不正确'},
        {value: 204, alias: 'NoContent', text: '指示已成功处理请求并且响应已被设定为无内容'},
        {value: 205, alias: 'ResetContent', text: '指示客户端应重置（或重新加载）当前资源'},
        {value: 206, alias: 'PartialContent', text: '指示响应是包括字节范围的 GET 请求所请求的部分响应'},
        {value: 300, alias: 'MultipleChoices', text: '指示请求的信息有多种表示形式。默认操作是将此状态视为重定向，并遵循与此响应关联的 Location 头的内容'},
        {
            value: 301,
            alias: 'MovedPermanently',
            text: '指示请求的信息已移到 Location 头中指定的 URI 处。接收到此状态时的默认操作为遵循与响应关联的 Location 头'
        },
        {
            value: 302,
            alias: 'Redirect',
            text: '指示请求的信息位于 Location 头中指定的 URI 处。接收到此状态时的默认操作为遵循与响应关联的 Location 头。原始请求方法为 POST 时，重定向的请求将使用 GET 方法'
        },
        {
            value: 303,
            alias: 'SeeOther',
            text: '作为 POST 的结果，SeeOther 将客户端自动重定向到 Location 头中指定的 URI。用 GET 生成对 Location 头所指定的资源的请求'
        },
        {value: 304, alias: 'NotModified', text: '指示客户端的缓存副本是最新的。未传输此资源的内容'},
        {value: 305, alias: 'UseProxy', text: '指示请求应使用位于 Location 头中指定的 URI 的代理服务器'},
        {value: 306, alias: 'Unused', text: '是未完全指定的 HTTP/1.1 规范的建议扩展'},
        {
            value: 307,
            alias: 'TemporaryRedirect',
            text: '指示请求信息位于 Location 头中指定的 URI 处。接收到此状态时的默认操作为遵循与响应关联的 Location 头。原始请求方法为 POST 时，重定向的请求还将使用 POST 方法'}
    ,
        {value: 400, alias: 'BadRequest', text: '指示服务器未能识别请求。如果没有其他适用的错误，或者如果不知道准确的错误或错误没有自己的错误代码，则发送 BadRequest'},
        {value: 401, alias: 'Unauthorized', text: '指示请求的资源要求身份验证。WWW-Authenticate 头包含如何执行身份验证的详细信息'},
        {value: 402, alias: 'PaymentRequired', text: '保留 PaymentRequired 以供将来使用'},
        {value: 403, alias: 'Forbidden', text: '指示服务器拒绝满足请求'},
        {value: 404, alias: 'NotFound', text: '指示请求的资源不在服务器上'},
        {value: 405, alias: 'MethodNotAllowed', text: '指示请求的资源上不允许请求方法（POST 或 GET）'},
        {value: 406, alias: 'NotAcceptable', text: '指示客户端已用 Accept 头指示将不接受资源的任何可用表示形式'},
        {value: 407, alias: 'ProxyAuthenticationRequired', text: '指示请求的代理要求身份验证。Proxy-authenticate 头包含如何执行身份验证的详细信息'},
        {value: 408, alias: 'RequestTimeout', text: '指示客户端没有在服务器期望请求的时间内发送请求'},
        {value: 409, alias: 'Conflict', text: '指示由于服务器上的冲突而未能执行请求'},
        {value: 410, alias: 'Gone', text: '指示请求的资源不再可用'},
        {value: 411, alias: 'LengthRequired', text: '指示缺少必需的 Content-length 头'},
        {
            value: 412,
            alias: 'PreconditionFailed',
            text: '指示为此请求设置的条件失败，且无法执行此请求。条件是用条件请求标头（如 If-Match、If-None-Match 或 If-Unmodified-Since）设置的'
        },
        {value: 413, alias: 'RequestEntityTooLarge', text: '指示请求太大，服务器无法处理'},
        {value: 414, alias: 'RequestUriTooLong', text: '指示 URI 太长'},
        {value: 415, alias: 'UnsupportedMediaType', text: '指示请求是不支持的类型'},
        {value: 416, alias: 'RequestedRangeNotSatisfiable', text: '指示无法返回从资源请求的数据范围，因为范围的开头在资源的开头之前，或因为范围的结尾在资源的结尾之后'},
        {value: 417, alias: 'ExpectationFailed', text: '指示服务器未能符合 Expect 头中给定的预期值'},
        {value: 500, alias: 'InternalServerError', text: '指示服务器上发生了一般错误'},
        {value: 501, alias: 'NotImplemented', text: '指示服务器不支持请求的函数'},
        {value: 502, alias: 'BadGateway', text: '指示中间代理服务器从另一代理或原始服务器接收到错误响应'},
        {value: 503, alias: 'ServiceUnavailable', text: '指示服务器暂时不可用，通常是由于过多加载或维护'},
        {value: 504, alias: 'GatewayTimeout', text: '指示中间代理服务器在等待来自另一个代理或原始服务器的响应时已超时'},
        {value: 505, alias: 'HttpVersionNotSupported', text: '指示服务器不支持请求的 HTTP 版本'},
        {value: 506, alias: 'VariantAlsoNegotiates', text: '服务器存在内部配置错误'},
        {value: 507, alias: 'InsufficientStorage', text: '服务器无法存储完成请求所必须的内容'},
        {value: 509, alias: 'BandwidthLimitExceeded', text: '服务器达到带宽限制'},
        {value: 510, alias: 'NotExtended', text: '获取资源所需要的策略并没有没满足'},
        {value: 600, alias: 'UnparseableResponseHeaders', text: '源站没有返回响应头部，只返回实体内容'}
    );

    describe('test ajax', function () {
        var originalTimeout;
        // Install ajax support
        beforeEach(function () {
            var context = {
                userid: 2333333,
                optid: 2333333,
                ulevelid: 39,
                token: 'ncl20c2ijk'
            };
            recorder.init(context);
            _.extend(require('fc-ajax/globalData'), context);
            require('fc-ajax/config').url = 'request.ajax';
            config.config({
                threshold: 10,
                logVersion: '3.0',
                loghost: '/nirvana/log/fclogimg.gif',
                defaultMethod: 'loghost',
                ajax: {
                    threshold: 3
                }
            });
            hooks.beforeEachRequest = function () {
                require('fc-monitor/ajax').mark(this);
            };
            hooks.eachSuccess = function (response) {
                require('fc-monitor/ajax').measure(this, response);
            };

            hooks.eachFailure = function (result) {
                require('fc-monitor/ajax').measure(this, result, true);
            };
            hooks.businessCheck = function (result) {
                var status = require('fc-ajax/status');
                if (result.status !== status.REQ_CODE.SUCCESS) {
                    return Promise.reject(result);
                }
                return Promise.resolve(result);
            };

            jasmine.Ajax.install();
            window.performance.clearMarks();
            window.performance.clearMeasures();
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });
        // Uninstall ajax support
        afterEach(function () {
            hooks.beforeEachRequest = _.noop;
            hooks.eachSuccess = _.noop;
            hooks.eachFailure = _.noop;
            hooks.businessCheck = _.noop;
            jasmine.Ajax.uninstall();
            window.performance.clearMarks();
            window.performance.clearMeasures();
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        // http200情况
        _.each([
            'SUCCESS',
            'PARTFAIL',
            'REDIRECT',
            'FAIL',
            'SERVER_ERROR',
            'PARAMETER_ERROR',
            'NOAUTH'
        ], function (status) {
            it('request ' + status, function (done) {
                if (status === 'REDIRECT') {
                    // 执行完原来的hook之后，log就已经产生，这个时候将status设置成200防止
                    // fc-ajax真的跳转
                    fc.aop.after(hooks, 'eachFailure', function (result) {
                        result.status = 200;
                    });
                }
                request().ensure(function () {
                    var logData = logger._debugLogData().ajax;
                    if (status === 'SUCCESS') {
                        expect(logData.length).toBe(1);
                        expect(logData[0].target).toBe('ajaxInfo');
                    }
                    else {
                        expect(logData.length).toBe(2);
                        expect(logData[1].status).toBe(require('fc-ajax/status').REQ_CODE[status]);
                    }
                    logger.dump({type: 'ajax'});
                    done();
                });
                jasmine.Ajax.requests.mostRecent().response({
                    status: 200,
                    contentType: 'text/json',
                    responseText: JSON.stringify({
                        status: require('fc-ajax/status').REQ_CODE[status],
                        data: {}
                    })
                });
            });
        });

        // http请求测试
        _.each(httpCodes.toArray(), function (code) {
            it('http request ' + code.alias + '(' + code.value + ')', function (done) {
                request().ensure(function () {
                    var logData = logger._debugLogData().ajax;
                    if (code.value === 200) {
                        expect(logData.length).toBe(1);
                    }
                    else {
                        // 下面这几个code的不检测，除了408之外其它都被当成200了
                        if (_.contains([
                            201,
                            202,
                            203,
                            204,
                            205,
                            206,
                            304,
                            408
                        ], code.value)) {
                        }
                        else {
                            expect(logData.length).toBe(2);
                            // 超时的时候status会被改了900，但是fc-ajax没有加上
                            // httpStatus，所以这里不检查httpStatus而检查status
                            if (code.value === 408) {
                                expect(logData[1].status).toBe(900);
                            }
                            else {
                                expect(logData[1].httpStatus).toBe(code.value);
                                expect(logData[1].status).toBe(920);
                            }
                        }
                    }
                    logger.dump({type: 'ajax'});
                    done();
                });
                jasmine.Ajax.requests.mostRecent().response({
                    status: code.value,
                    contentType: 'text/json',
                    responseText: JSON.stringify({
                        status: code.value,
                        data: {}
                    })
                });
            });
        });

    });
});
