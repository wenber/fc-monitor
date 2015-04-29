/**
 * Copyright (C) 2015 All rights reserved.
 *
 * @file configuration ajax configuration
 * @author Pride Leong<lykling.lyk@gmail.com>
 */

define(function (require, exports, module) {
    exports = {
        /**
         * Threshold of log queue
         * @type {number}
         */
        threshold: 20,

        defaultDumpOptions: {
            method: 'loghost'
        }
    };

    module.exports = exports;
});
