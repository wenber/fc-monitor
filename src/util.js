/**
 * Copyright (C) 2014 All rights reserved.
 *
 * @file util.js utils
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    'use strict';

    exports.getEntry = function (name) {
        var entry = null;
        try {
            entry = [].slice.call(
                window.performance.getEntriesByName(name),
                0
            ).pop();
        }
        catch (e) {
        }
        return entry;
    };

    exports.getEntries = window.performance.getEntries
        || window.performance.mozGetEntries
        || window.performance.msGetEntries
        || window.performance.oGetEntries
        || window.performance.webkitGetEntries
        || null;

    exports.measure = function (name, start, end) {
        var entry = null;
        try {
            window.performance.measure(name, start, end);
            entry = exports.getEntry(name);
        }
        catch (e) {
        }
        return entry;
    };

    exports.createEventId = function () {
        return require('fc-core').util.guid();
    };

    return module.exports = exports;
});
