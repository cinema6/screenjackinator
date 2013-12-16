(function($window){
    /* jshint camelcase:false */
    'use strict';

    var tests = Object.keys($window.__karma__.files).filter(function(file){
        return (/\.(ut|it)\.js$/).test(file);
    }),
        packageRequest = new XMLHttpRequest(),
        c6 = $window.c6 = {};

    packageRequest.open('GET', '/base/settings.json');
    packageRequest.send();

    $window.ga = function() {};

    c6.kBaseUrl = 'assets';
    c6.kLocal = true;
    c6.kDebug = true;
    c6.kHasKarma = true;
    c6.kLogLevels = ['error','warn','log','info'];
    c6.kVideoUrls = {
        local: 'assets/media',
        cdn: 'http://foo.cinema6.com/media/app'
    };
    c6.kModDeps = ['ui.router', 'c6.ui', 'c6.log'];

    packageRequest.onload = function(event) {
        var settings = JSON.parse(event.target.response),
            appDir = settings.appDir;

        function libUrl(url) {
            return 'http://s3.amazonaws.com/c6.dev/ext/' + url;
        }

        if (appDir.indexOf('<%') > -1) {
            $window.console.warn('PhantomJS can\'t interpolate Grunt templates. Using default.');
            appDir = 'app';
        }

        $window.requirejs({
            baseUrl: '/base/' + appDir + '/assets/scripts',

            paths: {
                angular: libUrl('angular/v1.1.5-0-g9a7035e/angular'),
                angularMocks: libUrl('angular/v1.1.5-0-g9a7035e/angular-mocks'),
                jquery: libUrl('jquery/2.0.3-0-gf576d00/jquery'),
                modernizr: libUrl('modernizr/modernizr.custom.71747'),
                tweenmax: libUrl('gsap/1.11.2-0-g79f8c87/TweenMax.min'),
                timelinemax: libUrl('gsap/1.11.2-0-g79f8c87/TimelineMax.min'),
                uirouter: libUrl('ui-router/0.2.0-0-g818b0d6/angular-ui-router'),
                c6ui: libUrl('c6ui/v1.2.9-0-g6e55613/c6uilib'),
                c6log: libUrl('c6ui/v1.2.9-0-g6e55613/c6log'),
                templates: '/base/.tmp/templates'
            },

            shim: {
                angular: {
                    deps: ['jquery']
                },
                angularMocks: {
                    deps: ['angular']
                },
                timelinemax: {
                    deps: ['tweenmax']
                },
                uirouter: {
                    deps: ['angular']
                },
                c6ui: {
                    deps: ['angular']
                },
                c6log: {
                    deps: ['c6ui']
                },
                templates: {
                    deps: ['app']
                },
                app: {
                    deps: ['angular', 'angularMocks', 'modernizr', 'timelinemax', 'uirouter', 'c6ui', 'c6log']
                }
            },

            priority: [
                'angular'
            ],

            deps: tests,

            callback: $window.__karma__.start
        });
    };
}(window));
