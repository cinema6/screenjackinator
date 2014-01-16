(function() {
    'use strict';

    module.exports = {
        options: {
            configFile: 'test/karma.conf.js'
        },
        unit: {
            options: {
                reporters: ['progress', 'junit'],
                junitReporter: {
                    outputFile: 'test-results.xml'
                }
            }
        },
        debug: {
            options: {
                singleRun: false,
                autoWatch: true
            }
        }
    };
})();
