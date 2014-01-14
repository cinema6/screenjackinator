(function() {
    'use strict';

    angular.module('c6.screenjackinator.services', ['c6.ui'])
        .service('ProjectService', ['$cacheFactory', 'c6Sfx', 'c6UrlMaker', 'c6VideoService', '$window', 'DubService', '$q', '$rootScope',
        function                   ( $cacheFactory ,  c6Sfx ,  c6UrlMaker ,  c6VideoService ,  $window ,  DubService ,  $q ,  $rootScope ) {
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
            _private.Model.prototype.trackVirginity = function() {
                this._virgin = angular.copy(this);
                this._virgin._virgin = this._virgin;
            };
            _private.Model.prototype.isVirgin = function() {
                var isVirgin = this._virgin && angular.equals(this, this._virgin);

                if (isVirgin === false) {
                    _private.Model.prototype.isVirgin = function() { return false; };
                }

                return isVirgin;
            };

            /***************************************
             * Voice(config)
             **************************************/
            _private.Voice = function(config) {
                this.setupWith(config);

                this.voiceFx = this.voiceFx && _private.get('VoiceFx', { id: config.voiceFx });
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

                this.voiceBox = new $window.Audio();

                this.haveMP3For = null;

                this.trackVirginity();
            };
            _private.Annotation.prototype = new _private.Model({});
            _private.Annotation.prototype.constructor = _private.Annotation;
            _private.Annotation.prototype._type = 'Annotation';
            _private.Annotation.prototype.getMP3 = function() {
                var voice = this.voice,
                    voiceFx = voice && voice.voiceFx,
                    options = voice ? {
                        voice: this.voice.id,
                        effect: voiceFx && voiceFx.id,
                        level: voiceFx && 1
                    } : {},
                    self = this,
                    voiceBox = this.voiceBox;

                function waitForVoiceBox(src) {
                    var deferred = $q.defer();

                    function cleanUp() {
                        voiceBox.removeEventListener('error', reject, false);
                        voiceBox.removeEventListener('canplaythrough', resolve, false);
                    }

                    function resolve() {
                        $rootScope.$apply(function() {
                            deferred.resolve(self);
                        });
                        cleanUp();
                    }

                    function reject(event) {
                        $rootScope.$apply(function() {
                            deferred.reject(event.target.error);
                        });
                        cleanUp();
                    }

                    voiceBox.addEventListener('canplaythrough', resolve, false);
                    voiceBox.addEventListener('error', reject, false);

                    voiceBox.src = src;
                    voiceBox.load();

                    return deferred.promise;
                }

                if (this.haveMP3For === this.text) {
                    return $q.when(this);
                }

                this.haveMP3For = this.text;

                return DubService.getMP3(this.text, options)
                    .then(waitForVoiceBox);
            };
            _private.Annotation.prototype.speak = function() {
                function play(self) {
                    var deferred = $q.defer(),
                        voiceBox = self.voiceBox;

                    function cleanUp() {
                        voiceBox.removeEventListener('ended', resolve, false);
                        voiceBox.removeEventListener('stalled', reject, false);
                    }

                    function resolve() {
                        $rootScope.$apply(function() {
                            deferred.resolve(self);
                        });
                        cleanUp();
                    }

                    function reject(event) {
                        $rootScope.$apply(function() {
                            deferred.reject(event.target.error);
                        });
                        cleanUp();
                    }

                    voiceBox.addEventListener('ended', resolve, false);
                    voiceBox.addEventListener('stalled', reject, false);

                    voiceBox.play();

                    return deferred.promise;
                }

                return this.getMP3()
                    .then(play);
            };

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

        .provider('DubService', [function() {
            var _provider = {};

            this.useDubAt = function(url) {
                _provider.dubUrl = url;

                return this;
            };

            if (window.c6.kHasKarma) { this._private = _provider; }

            this.$get = ['$timeout', '$http', '$q',
            function    ( $timeout ,  $http ,  $q ) {
                function DubService() {
                    var _service = {};

                    _service.handleDubResponse = function(response, deferred) {
                        var jobId = response.data.jobId,
                            host = response.data.host;

                        function recurse(response) {
                            _service.handleDubResponse(response, deferred);
                        }

                        function reject(error) {
                            deferred.reject(error);
                        }

                        if (response.status === 201) {
                            deferred.resolve(response.data.output);
                        } else {
                            $timeout(function() {
                                $http.get((_provider.dubUrl + '/track/status/' + jobId), {
                                    params: {
                                        host: host
                                    }
                                })
                                    .then(recurse, reject);
                            }, 1000);
                        }
                    };

                    this.getMP3 = function(text, options) {
                        var deferred = $q.defer(),
                            data = {
                                tts: options,
                                line: text
                            };

                        function success(response) {
                            _service.handleDubResponse(response, deferred);
                        }

                        $http.post((_provider.dubUrl + '/track/create'), data)
                            .then(success, deferred.reject);

                        return deferred.promise;
                    };

                    if (window.c6.kHasKarma) { this._private = _service; }
                }
                return new DubService();
            }];
        }])

        .service('VoiceTrackService', ['$q',
        function                      ( $q ) {
            var state = {
                    ready: false,
                    paused: true,
                    annotations: [],
                    currentTime: 0
                },
                self = this;

            Object.defineProperties(this, {
                paused: {
                    get: function() {
                        return state.paused;
                    }
                },
                annotations: {
                    get: function() {
                        return state.annotations;
                    }
                },
                ready: {
                    get: function() {
                        return state.ready;
                    }
                },
                currentTime: {
                    get: function() {
                        return state.currentTime;
                    }
                }
            });

            this.init = function(annotations) {
                state.annotations = annotations;

                return $q.all(annotations.map(function(annotation) {
                    return annotation.getMP3();
                }))
                    .then(function() {
                        return self;
                    });
            };

            this.play = function() {
                state.paused = false;

                this.tick(state.currentTime);
            };

            this.pause = function() {
                state.paused = true;

                angular.forEach(state.annotations, function(annotation) {
                    annotation.voiceBox.pause();
                });
            };

            this.tick = function(time) {
                var annotations = state.annotations;

                state.currentTime = time;

                if (state.paused) {
                    angular.forEach(annotations, function(annotation) {
                        var targetTime = Math.max((time - annotation.timestamp), 0),
                            voiceBox = annotation.voiceBox;

                        if (targetTime > voiceBox.duration) {
                            targetTime = 0;
                        }

                        voiceBox.currentTime = targetTime;
                    });
                } else {
                    angular.forEach(annotations, function(annotation) {
                        var voiceBox = annotation.voiceBox,
                            targetTime = annotation.timestamp,
                            duration = voiceBox.duration,
                            targetEnd = (targetTime + duration),
                            shouldBePlaying = (time >= targetTime && time < targetEnd),
                            isPlaying = (!voiceBox.paused && !voiceBox.ended);

                        if (shouldBePlaying && !isPlaying) {
                            voiceBox.play();
                        }
                    });
                }
            };
        }]);
}());
