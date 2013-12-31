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
            var assetLocation = (function() {
                switch(c6Defines.kEnv) {
                case 'dev':
                    return 'local';
                case 'staging':
                    return 'dev';
                case 'release':
                    return 'cdn';
                }
            }());

            c6UrlMakerProvider.location(c6Defines.kBaseUrl,'default');
            c6UrlMakerProvider.location(c6Defines.kVideoUrls[assetLocation] ,'video');
            c6UrlMakerProvider.location(c6Defines.kCollateralUrls[assetLocation], 'collateral');
        }])
        .config(['$stateProvider', '$urlRouterProvider', 'c6UrlMakerProvider',
        function( $stateProvider ,  $urlRouterProvider ,  c6UrlMakerProvider ) {
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state('landing', {
                    templateUrl: c6UrlMakerProvider.makeUrl('views/landing.html'),
                    controller: 'LandingController',
                    url: '/?playback'
                })
                .state('experience', {
                    templateUrl: c6UrlMakerProvider.makeUrl('views/experience.html'),
                    controller: 'ExperienceController',
                    url: '/experience'
                })
                .state('player', {
                    templateUrl: c6UrlMakerProvider.makeUrl('views/player.html'),
                    controller: 'PlayerController',
                    url: '/player'
                });
        }])
        .controller('AppController', ['$scope','$state','$log', 'site', 'c6ImagePreloader', 'gsap', '$timeout', 'googleAnalytics', '$http', 'c6UrlMaker', 'ProjectService', 'VideoService', '$q', 'fail', 'c6Computed',
        function                     ( $scope , $state , $log ,  site ,  c6ImagePreloader ,  gsap ,  $timeout ,  googleAnalytics ,  $http ,  c6UrlMaker ,  ProjectService ,  VideoService ,  $q ,  fail ,  c          ) {
            var self = this,
                canChangeState = false;

            $log.info('AppCtlr loaded.');

            VideoService.listenOn($scope);

            this.videoSrc = c($scope, function(src) {
                return src && c6UrlMaker(src, 'video');
            }, ['AppCtrl.project.src']);

            this.stylesheets = c($scope, function(styles) {
                if (!styles) {
                    return [];
                }

                return styles.map(function(style) {
                    return style.stylesheet;
                });
            }, ['AppCtrl.project.styles']);

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

            this.goto = function(state, toParams) {
                $state.go(state, toParams);
            };

            function createProject(results) {
                var appConfig = results.appConfigResponse.data,
                    videoConfig = results.appData.experience.data;

                self.project = ProjectService.new(appConfig, videoConfig);
            }

            $q.all({
                appConfigResponse: $http.get(c6UrlMaker('app.config.json', 'collateral')),
                appData: site.getAppData()
            })
                .then(createProject)
                .then(null, fail);

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
                if (!fromState.name || canChangeState ||
                    (fromState.name !== 'landing' && toState.name !== 'landing')) {
                    return;
                }

                event.preventDefault();

                site.requestTransitionState(true)
                    .then(function() {
                        canChangeState = true;

                        self.goto(toState.name, toParams);

                        $timeout(function() { canChangeState = false; });

                        return site.requestTransitionState(false);
                    })
                    .then(function() {
                        $scope.$broadcast('siteTransitionComplete');
                    });
            });

            $scope.$on('$stateChangeSuccess',
                function(event,toState,toParams,fromState){
                $log.info('State Change Success: ' + fromState.name +
                          ' ===> ' + toState.name);

                googleAnalytics('send', 'event', '$state', 'changed', toState.name);
            });

            $scope.AppCtrl = this;
        }])

        .factory('fail', ['$log', 'googleAnalytics',
        function         ( $log ,  googleAnalytics ) {
            return function(error) {
                googleAnalytics('send', 'event', 'error', 'thrown', error);
                $log.error(error);
            };
        }])

        .directive('c6Plane', ['fail', '$rootScope', '$timeout',
        function              ( fail ,  $rootScope ,  $timeout ) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    var name = attrs.c6Plane,
                        priority = parseInt(attrs.priority, 10);

                    function eventName(event) {
                        return 'c6Plane[' + name + ']:' + event;
                    }

                    if (!name) {
                        fail('A plane was created with no name! Reality collapse imminent!');
                    }

                    // Let everybody know we're here! Needs to happen on $rootScope so
                    // EVERYBODY knows!
                    $rootScope.$broadcast(eventName('appeared'), element, priority);

                    // Handle other planes with our name appearing
                    scope.$on(eventName('appeared'), function(event, newPlane, newPlanePriority) {
                        if (newPlanePriority < priority) {
                            newPlane.append(element.contents());
                        }
                    });

                    scope.$on('$destroy', function() {
                        scope.$emit(eventName('destroying'), element, priority);
                    });

                    scope.$on(eventName('adopted'), function(event, thatPlane, theirPriority) {
                        if (priority > theirPriority || element[0] === thatPlane[0]) {
                            return;
                        }

                        element.append(thatPlane.contents());
                        $rootScope.$broadcast(eventName('adopted'), element, priority);
                    });

                    scope.$on(eventName('destroying'), function(event, destroyingPlane) {
                        element.append(destroyingPlane.contents());
                        $timeout(function() {
                            $rootScope.$broadcast(eventName('adopted'), element, priority);
                        });
                    });
                }
            };
        }])
        .directive('c6VerticalCenter', ['$window',
        function                       ( $window ) {
            return {
                link: function(scope, element, attrs) {
                    var window$ = angular.element($window),
                        topProp = attrs.c6VerticalCenter || 'margin-top',
                        element_ = element[0],
                        height = function() { return element_.offsetHeight; },
                        offsetParent_ = element_.offsetParent,
                        parentHeight = function() { return offsetParent_.offsetHeight; },
                        top = function() { return (parentHeight() / 2) - (height() / 2); };

                    function set() {
                        element.css(topProp, (top() + 'px'));
                    }

                    scope.$on('c6VerticalCenter:recalculate', set);

                    if (!angular.isUndefined(attrs.resize)) {
                        window$.bind('resize', set);

                        scope.$on('$destroy', function() {
                            window$.unbind('resize', set);
                        });
                    }

                    set();
                }
            };
        }]);
}(window));
