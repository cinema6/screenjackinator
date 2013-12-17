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
        }])

        .service('ProjectService', ['$cacheFactory', 'c6Sfx',
        function                   ( $cacheFactory ,  c6Sfx ) {
            var _private = {};

            /* PROPERTIES */
            _private.cache = $cacheFactory('project');

            /* METHODS */
            _private.get = function(type, data) {
                var cache = _private.cache.get(type),
                    model = cache && cache.get(data.id),
                    constructorArgs = Array.prototype.slice.call(arguments, 1),
                    Constructor;

                constructorArgs.unshift(null);
                Constructor = _private[type].bind.apply(_private[type], constructorArgs);
                Constructor.prototype = _private[type].prototype;

                return model || new Constructor().cache();
            };

            /* CONSTRUCTORS */
            _private.Model = function(config) {
                this.id = config.id;
            };
            _private.Model.prototype._type = 'Model';
            _private.Model.prototype.setupWith = function(config) {
                var prop;

                for (prop in config) {
                    this[prop] = config[prop];
                }
            };
            _private.Model.prototype.cache = function() {
                var cache = _private.cache.get(this._type);

                if (!cache) {
                    cache = _private.cache.put(this._type, $cacheFactory('project:' + this.constructor));
                }

                return cache.put(this.id, this);
            };

            _private.Voice = function(config) {
                this.setupWith(config);
            };
            _private.Voice.prototype = new _private.Model({});
            _private.Voice.prototype.constructor = _private.Voice;
            _private.Voice.prototype._type = 'Voice';

            _private.VoiceFx = function(config) {
                this.setupWith(config);
            };
            _private.VoiceFx.prototype = new _private.Model({});
            _private.VoiceFx.prototype.constructor = _private.VoiceFx;
            _private.VoiceFx.prototype._type = 'VoiceFx';

            _private.Style = function(config) {
                this.setupWith(config);
            };
            _private.Style.prototype = new _private.Model({});
            _private.Style.prototype.constructor = _private.Style;
            _private.Style.prototype._type = 'Style';

            _private.Sfx = function(config) {
                var sfx;

                c6Sfx.loadSounds([config]);
                sfx = c6Sfx.getSoundByName(config.name);

                sfx.cache = _private.Model.prototype.cache;
                sfx._type = 'Sfx';

                return sfx;
            };

            _private.Annotation = function(config, defaultPermissions, defaultStyle) {
                this.permissions = defaultPermissions;

                this.setupWith(config);

                this.style = _private.get('Style', { id: (config.style || defaultStyle) });
            };
            _private.Annotation.prototype = new _private.Model({});
            _private.Annotation.prototype.constructor = _private.Annotation;
            _private.Annotation.prototype._type = 'Annotation';

            _private.Project = function(appConfig, videoConfig) {
                var styles = [],
                    voices = [],
                    voiceFx = [],
                    sfx = [],
                    annotations = [],
                    defaultPermissions, defaultStyle;

                angular.extend(this, appConfig, videoConfig);

                defaultPermissions = this.defaults.permissions;
                defaultStyle = this.defaults.style;

                this.voices.forEach(function(voice) {
                    voices.push(_private.get('Voice', voice));
                });
                this.voices = voices;

                this.voiceFx.forEach(function(fx) {
                    voiceFx.push(_private.get('VoiceFx', fx));
                });
                this.voiceFx = voiceFx;

                this.styles.forEach(function(style) {
                    styles.push(_private.get('Style', style));
                });
                this.styles = styles;

                this.sfx.forEach(function(fx) {
                    sfx.push(_private.get('Sfx', fx));
                });
                this.sfx = sfx;

                this.annotations.forEach(function(annotation) {
                    annotations.push(_private.get('Annotation', annotation, defaultPermissions, defaultStyle));
                });
                this.annotations = annotations;
            };

            this.new = function(appConfig, videoConfig) {
                return new _private.Project(appConfig, videoConfig);
            };

            if (window.c6.kHasKarma) { this._private = _private; }
        }]);
}(window));
