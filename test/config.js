/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file configuration
 * @author Pride Leong<lykling.lyk@gmail.com>
 */
/*eslint-env node, mocha */
// Test configuration for edp-test
// Generated on Tue Apr 28 2015 14:11:11 GMT+0800 (CST)
module.exports = {

    // base path, that will be used to resolve files and exclude
    basePath: '../',


    // frameworks to use
    frameworks: ['jasmine', 'esl'],


    // list of files / patterns to load in the browser
    files: [
        '../src/**/*.js',
        'test/src/**/*.spec.js',
        'test/src/**/*.feature.js'
    ],


    // list of files to exclude
    exclude: [

    ],

    // optionally, configure the reporter
    coverageReporter: {
        // text-summary | text | html | json | teamcity | cobertura | lcov
        // lcovonly | none | teamcity
        type: 'text|html',
        dir: 'test/coverage/'
    },

    // web server port
    port: 8120,


    // enable / disable watching file and executing tests whenever any file changes
    watch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - Firefox
    // - Opera
    // - Safari
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
        // 'Chrome',
        // 'Firefox',
        // 'Safari',
        'PhantomJS'
    ],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,


    // Custom HTML templates
    // context | debug | runner
    templates: {
        context: 'context.html',
        debug: 'debug.html'
    }
};
