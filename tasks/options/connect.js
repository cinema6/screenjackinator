(function() {
    'use strict';

    var grunt = require('grunt'),
        c6Sandbox = require('c6-sandbox');

    module.exports = {
        options: {
            hostname: '0.0.0.0'
        },
        sandbox: {
            options: {
                port: '<%= settings.sandboxPort %>',
                middleware: function() {
                    return [
                        require('connect-livereload')(),
                        c6Sandbox({
                            landingContentDir: grunt.template.process('<%= settings.collateralDir %>'),
                            experiences: grunt.config.process(
                                grunt.file.readJSON(
                                    grunt.template.process('<%= settings.experiencesJSON %>')
                                )
                            )
                        })
                    ];
                }
            }
        }
    };
})();
