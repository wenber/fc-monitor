/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file main.js
 * @author Pride Leong<lykling.lyk@gmail.com>
 */
/* eslint-env node */

window.performance.mark('performance_static_js_sync_loaded');

define(function (require, exports, module) {
    var config = require('fc-monitor/config');
    var logger = require('fc-monitor/logger');
    var recorder = require('fc-monitor/recorder');
    var fc = require('fc-core');
    var context = {
        userid: 39,
        optis: 39,
        ulevelid: 39,
        token: 'ncl20c2ijk'
    };
    var staticMarks = [
        'performance_static_html_parse',
        'performance_static_css_loaded',
        'performance_static_js_sync_loaded',
        'performance_static_js_async_loaded',
        'performance_static_basicInfo_start',
        'performance_static_basicInfo_finish',
        'performance_static_er_inited'
    ];
    var materialListMarks = [
        'performance_materialList_start_0',
        'performance_materialList_data_loaded_1',
        'performance_materialList_view_rendered_2',
        'performance_materialList_finish_3'
    ];
    window.performance.mark('performance_static_js_async_loaded');
    window.performance.mark('performance_static_basicInfo_start');
    window.performance.mark('performance_static_basicInfo_finish');

    recorder.init(context);

    window.performance.mark('performance_static_er_inited');

    config.config({
        resourceWatchingList: [
            /(src|asset)\/.*(initer|main).*\.js/g
        ],
        staticMarks: staticMarks,
        timelineMarks: [].concat(staticMarks, materialListMarks)
    });

    window.setTimeout(function () {
        require('fc-monitor/performance/static').measure();
        require('fc-monitor/performance/resource').measure();
        var itemKey = 'materialList';
        require('fc-monitor/performance').mark(itemKey, 'start');
        require('fc-monitor/performance').mark(itemKey, 'data_loaded');
        require('fc-monitor/performance').mark(itemKey, 'view_rendered');
        require('fc-monitor/performance').mark(itemKey, 'finish').measure(itemKey);
        console.log(require('fc-monitor/performance/timeline').measure(staticMarks));
        fc.setImmediate(function () {
            logger.dump({method: 'console'});
        });
    }, 1000);

    require('fc-monitor/performance').mark('a');
    require('fc-monitor/performance').mark('a');
    require('fc-monitor/performance').mark('a');
    require('fc-monitor/performance').measure('a');
    logger.dump({method: 'loghost'});
    var body = document.getElementsByTagName('body')[0];
    var span = document.createElement('span');
    span.innerHTML = 'OK';
    span.style.color = '#DB1616';
    body.appendChild(span);

});

require(['main']);
