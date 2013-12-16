(function() {
    'use strict';

    module.exports = {
        options: {
            configFile: 'test/karma.conf.js'
        },
        unit: {},
        debug: {
            options: {
                singleRun: false,
                autoWatch: true
            }
        }
    };
})();
