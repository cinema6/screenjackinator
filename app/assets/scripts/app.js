(function(window$){
    /* jshint -W106 */
    'use strict';

    if (window$.location.toString().match(/cinema6\.com/)){
        ga('create', 'UA-44457821-1', 'cinema6.com');
    } else {
        ga('create', 'UA-44457821-1', { 'cookieDomain' : 'none' });
    }

    angular.module('c6.screenjackinator', window$.c6.kModDeps)
        .constant('c6Defines', window$.c6)
        .config(['$provide',
        function( $provide ) {
            var config = {
                modernizr: 'Modernizr',
                gsap: [
                    'TimelineLite',
                    'TimelineMax',
                    'TweenLite',
                    'TweenMax',
                    'Back',
                    'Bounce',
                    'Circ',
                    'Cubic',
                    'Ease',
                    'EaseLookup',
                    'Elastic',
                    'Expo',
                    'Linear',
                    'Power0',
                    'Power1',
                    'Power2',
                    'Power3',
                    'Power4',
                    'Quad',
                    'Quart',
                    'Quint',
                    'RoughEase',
                    'Sine',
                    'SlowMo',
                    'SteppedEase',
                    'Strong'
                ],
                googleAnalytics: 'ga'
            };

            angular.forEach(config, function(value, key) {
                if (angular.isString(value)) {
                    $provide.value(key, window[value]);
                } else if (angular.isArray(value)) {
                    $provide.factory(key, function() {
                        var service = {};

                        angular.forEach(value, function(global) {
                            service[global] = window[global];
                        });

                        return service;
                    });
                }
            });
        }])
        .config(['c6UrlMakerProvider', 'c6Defines',
        function( c6UrlMakerProvider ,  c6Defines ) {
            c6UrlMakerProvider.location(c6Defines.kBaseUrl,'default');
            c6UrlMakerProvider.location(c6Defines.kVideoUrls[(function() {
                return 'local';
            }())] ,'video');
        }])
        .config(['$stateProvider', '$urlRouterProvider', 'c6UrlMakerProvider',
        function( $stateProvider ,  $urlRouterProvider ,  c6UrlMakerProvider ) {
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state('landing', {
                    templateUrl: c6UrlMakerProvider.makeUrl('views/landing.html'),
                    url: '/'
                })
                .state('experience', {
                    templateUrl: c6UrlMakerProvider.makeUrl('views/experience.html'),
                    url: '/experience'
                });
        }])
        .controller('AppController', ['$scope','$state','$log', 'site', 'c6ImagePreloader', 'gsap', '$timeout', 'googleAnalytics',
        function                     ( $scope , $state , $log ,  site ,  c6ImagePreloader ,  gsap ,  $timeout ,  googleAnalytics ) {
            var self = this,
                canChangeState = false;

            $log.info('AppCtlr loaded.');

            this.src = function(src) {
                var profile = self.profile,
                    modifiers = {
                        slow: '--low',
                        average: '--med',
                        fast: '--high'
                    },
                    speed, webp, extArray, ext;

                if (!src || !profile) {
                    return null;
                }

                speed = profile.speed;
                webp = profile.webp;
                extArray = src.split('.');
                ext = extArray[extArray.length - 1];

                if (webp && speed !== 'slow') {
                    return src.replace(('.' + ext), (modifiers[speed] + '.webp'));
                } else {
                    return src.replace(('.' + ext), (modifiers[speed] + '.' + ext));
                }
            };

            this.goto = function(state) {
                $state.go(state);
            };

            site.init({
                setup: function(appData) {
                    self.experience = appData.experience;
                    self.profile = appData.profile;

                    gsap.TweenLite.ticker.useRAF(self.profile.raf);

                    return c6ImagePreloader.load([self.src(self.experience.img.hero)]);
                }
            });

            site.getSession().then(function(session) {
                session.on('gotoState', function(state) {
                    if (state === 'start') {
                        self.goto('landing');
                    }
                });
            });

            $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState) {
                if (!fromState.name || canChangeState) {
                    return;
                }

                event.preventDefault();

                site.requestTransitionState(true).then(function() {
                    canChangeState = true;

                    self.goto(toState.name);

                    site.requestTransitionState(false);

                    $timeout(function() { canChangeState = false; });
                });
            });

            $scope.$on('$stateChangeSuccess',
                function(event,toState,toParams,fromState){
                $log.info('State Change Success: ' + fromState.name +
                          ' ===> ' + toState.name);

                googleAnalytics('send', 'event', '$state', 'changed', toState.name);
            });

            $scope.AppCtrl = this;
        }]);
}(window));
