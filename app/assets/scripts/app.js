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
                    url: '/'
                })
                .state('experience', {
                    templateUrl: c6UrlMakerProvider.makeUrl('views/experience.html'),
                    controller: 'ExperienceController',
                    url: '/experience'
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

            this.goto = function(state) {
                $state.go(state);
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

        .factory('fail', ['$log', 'googleAnalytics',
        function         ( $log ,  googleAnalytics ) {
            return function(error) {
                googleAnalytics('send', 'event', 'error', 'thrown', error);
                $log.error(error);
            };
        }])

        .service('ProjectService', ['$cacheFactory', 'c6Sfx', 'c6UrlMaker', 'c6VideoService',
        function                   ( $cacheFactory ,  c6Sfx ,  c6UrlMaker ,  c6VideoService ) {
            var _private = {};

            /* @private PROPERTIES */
            _private.cache = $cacheFactory('project');

            /* @private METHODS */
            _private.get = function(type, data) {
                var cache = _private.cache.get(type),
                    model = cache && cache.get(data.id),
                    // Get all arguments after the first one
                    constructorArgs = Array.prototype.slice.call(arguments, 1),
                    Constructor;

                // Because we're going to pass this array in when applying the "bind"
                // function, the first argument will need to be the "this" that should be bound.
                // It doesn't matter what "this" is bound as because when we invoke "new" on
                // the constructor, "this" will become the object JS generates for the
                // constructor. We could provide anything as "this" to the bind method, so we
                // just pass in "null".
                constructorArgs.unshift(null);
                // Bind the constructor to be called with all arguments after the first one.
                // This is the same as calling: _private[type].bind(null, arg2, arg3, arg4, etc...);
                Constructor = _private[type].bind.apply(_private[type], constructorArgs);

                // If the model isn't cached, invoke the constructor. Because we've bound all arguments
                // of this function after the first one, what's actually happening here is something
                // more like this:
                // return model || new Constructor(arg2, arg3, arg4, etc.).cache();
                //
                // To paraphrase a comment found in the $digest function for Angular Scopes,
                // "This works, and we have the tests to prove it!"
                return model || new Constructor().cache();
            };

            /* @private CONSTRUCTORS */

            /***************************************
             * Model(config)
             **************************************/
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
                    cache = _private.cache.put(this._type, $cacheFactory('project:' + this._type));
                }

                return cache.put(this.id, this);
            };

            /***************************************
             * Voice(config)
             **************************************/
            _private.Voice = function(config) {
                this.setupWith(config);
            };
            _private.Voice.prototype = new _private.Model({});
            _private.Voice.prototype.constructor = _private.Voice;
            _private.Voice.prototype._type = 'Voice';

            /***************************************
             * VoiceFx(config)
             **************************************/
            _private.VoiceFx = function(config) {
                this.setupWith(config);
            };
            _private.VoiceFx.prototype = new _private.Model({});
            _private.VoiceFx.prototype.constructor = _private.VoiceFx;
            _private.VoiceFx.prototype._type = 'VoiceFx';

            /***************************************
             * Style(config)
             **************************************/
            _private.Style = function(config) {
                this.setupWith(config);

                this.stylesheet = c6UrlMaker(config.stylesheet, 'collateral');
            };
            _private.Style.prototype = new _private.Model({});
            _private.Style.prototype.constructor = _private.Style;
            _private.Style.prototype._type = 'Style';

            /***************************************
             * Sfx(config)
             **************************************/
            _private.Sfx = function(config) {
                var sfx;

                config.src = c6UrlMaker(config.src, 'collateral');

                c6Sfx.loadSounds([config]);
                sfx = c6Sfx.getSoundByName(config.name);

                sfx.cache = _private.Model.prototype.cache;
                sfx.id = config.id;
                sfx._type = 'Sfx';

                return sfx;
            };

            /***************************************
             * Annotation(config, defaultPermissions, defaultStyle)
             **************************************/
            _private.Annotation = function(config, defaults) {
                function isRelationship(key) {
                    var relationships = ['style', 'sfx', 'voice'];

                    return relationships.indexOf(key) > -1;
                }

                function capitalize(string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                }

                this.setupWith(config);

                angular.forEach(defaults, function(value, key) {
                    if (angular.isUndefined(this[key])) {
                        this[key] = value;
                    }
                }.bind(this));

                angular.forEach(this, function(value, key) {
                    if (isRelationship(key) && value) {
                        this[key] = _private.get(capitalize(key), { id: value });
                    }
                }.bind(this));
            };
            _private.Annotation.prototype = new _private.Model({});
            _private.Annotation.prototype.constructor = _private.Annotation;
            _private.Annotation.prototype._type = 'Annotation';

            /***************************************
             * Project(appConfig, videoConfig)
             **************************************/
            _private.Project = function(appConfig, videoConfig) {
                var hasMany = {
                    voices: {
                        type: 'Voice'
                    },
                    voiceFx: {
                        type: 'VoiceFx'
                    },
                    styles: {
                        type: 'Style'
                    },
                    sfx: {
                        type: 'Sfx'
                    },
                    annotations: {
                        type: 'Annotation',
                        args: []
                    }
                };

                // Inherit from appConfig, then videoConfig;
                angular.extend(this, appConfig, videoConfig);

                // Give the src an extension
                this.src += ('.' + c6VideoService.extensionForFormat(c6VideoService.bestFormat()));

                // Expand thumb urls to be in collateral dir
                angular.forEach(this.thumbs, function(thumb, index) {
                    this.thumbs[index] = c6UrlMaker(thumb, 'collateral');
                }.bind(this));

                hasMany.annotations.args.push(this.defaults);

                // Convert POJOs to one of the useful above types
                angular.forEach(hasMany, function(settings, prop) {
                    var items = this[prop];

                    this[prop] = items.map(function(item, index) {
                        var args;

                        item.id = item.id || index;

                        args = [settings.type, item];
                        args.push.apply(args, settings.args || []);

                        return _private.get.apply(_private, args);
                    });
                }.bind(this));
            };

            /* @public METHODS */
            this.new = function(appConfig, videoConfig) {
                return new _private.Project(appConfig, videoConfig);
            };

            if (window.c6.kHasKarma) { this._private = _private; }
        }])
        .service('VideoService', ['$q', '$timeout',
        function                 ( $q ,  $timeout ) {
            var _private = {};

            _private.antilisteners = [];
            _private.videoDeferreds = {};

            _private.handleVideoReady = function(event, video) {
                // Get existing deferred or create new one. Resolve it.
                (_private.videoDeferreds[video.id] = (_private.videoDeferreds[video.id] || $q.defer()))
                    .resolve(video);
            };

            _private.waitForController = function(scope, expression) {
                var deferred = $q.defer();

                scope.$watch(expression, function(result) {
                    if (result) {
                        deferred.resolve(true);
                    }
                });

                return deferred.promise;
            };

            this.listenOn = function(scope) {
                _private.antilisteners.push(scope.$on('c6video-ready', _private.handleVideoReady));
            };

            this.ignore = function() {
                angular.forEach(_private.antilisteners, function(deregister) {
                    deregister();
                });

                _private.antilisteners.length = 0;
            };

            this.getVideo = function(id) {
                // Get existing deferred or create new one. Return promise.
                return (_private.videoDeferreds[id] = (_private.videoDeferreds[id] || $q.defer()))
                    .promise;
            };

            this.bindTo = function(id, delegate, controller, scope, expression) {
                this.getVideo(id)
                    .then(function(video) {
                        return $q.all({
                            video: video,
                            waiting: _private.waitForController(scope, expression)
                        });
                    })
                    .then(function(results) {
                        var video = results.video,
                            wasPlaying;

                        controller.buffer(video.bufferedPercent() * 100);

                        video
                            .on('play', function() {
                                controller.play();
                            })
                            .on('pause', function() {
                                controller.pause();
                            })
                            .on('timeupdate', function(event, video) {
                                var currentTime = video.player.currentTime,
                                    duration = video.player.duration;

                                controller.progress((currentTime / duration) * 100);
                            })
                            .on('progress', function(event, video) {
                                controller.buffer(video.bufferedPercent() * 100);
                            })
                            .on('volumechange', function(event, video) {
                                controller.muteChange(video.player.muted);
                                controller.volumeChange(video.player.volume * 100);
                            })
                            .on('seeked', function(event, video) {
                                if (wasPlaying) {
                                    video.player.play();
                                }
                            });

                        delegate.play = video.player.play.bind(video.player);
                        delegate.pause = video.player.pause.bind(video.player);
                        delegate.seekStart = function() {
                            wasPlaying = !video.player.paused;
                            video.player.pause();
                        };
                        delegate.seek = function(event) {
                            $timeout(function() { controller.progress(event.percent); });
                        };
                        delegate.seekStop = function(event) {
                            video.player.currentTime = (event.percent * video.player.duration) / 100;
                        };
                        delegate.volumeSeek = function(percent) {
                            video.player.volume = percent / 100;
                        };
                        delegate.mute = function() {
                            video.player.muted = true;
                        };
                        delegate.unmute = function() {
                            video.player.muted = false;
                        };
                    });
            };

            if (window.c6.kHasKarma) { this._private = _private; }
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
