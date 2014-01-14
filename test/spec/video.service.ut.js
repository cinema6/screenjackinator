(function() {
    'use strict';

    define(['services'], function() {
        describe('VideoService', function() {
            var VideoService,
                $rootScope,
                $scope,
                $q,
                $timeout;

            var _private;

            beforeEach(function() {
                module('c6.screenjackinator.services');

                inject(function($injector) {
                    VideoService = $injector.get('VideoService');
                    _private = VideoService._private;

                    $rootScope = $injector.get('$rootScope');
                    $q = $injector.get('$q');
                    $timeout = $injector.get('$timeout');

                    $scope = $rootScope.$new();
                });
            });

            it('should exist', function() {
                expect(VideoService).toBeDefined();
            });

            it('should publish its _private object under test', function() {
                expect(_private).toBeDefined();
            });

            describe('@private', function() {
                describe('methods', function() {
                    describe('waitForController(scope, expression)', function() {
                        var spy;

                        beforeEach(function() {
                            spy = jasmine.createSpy('handler');
                        });

                        describe('if the expression is already true', function() {
                            beforeEach(function() {
                                $scope.foo = {
                                    ready: true
                                };

                                $scope.$apply(function() {
                                    _private.waitForController($scope, 'foo.ready').then(spy);
                                });
                            });

                            it('should immediately resolve the promise', function() {
                                expect(spy).toHaveBeenCalledWith(true);
                            });
                        });

                        describe('if the expression is not true', function() {
                            it('should resolve the promise when the expression becomes true', function() {
                                $scope.$apply(function() {
                                    _private.waitForController($scope, 'foo.ready').then(spy);
                                });

                                expect(spy).not.toHaveBeenCalledWith(true);

                                $scope.$apply(function() {
                                    $scope.foo = {
                                        ready: true
                                    };
                                });

                                expect(spy).toHaveBeenCalledWith(true);
                            });
                        });
                    });

                    describe('handleVideoReady', function() {
                        var deferred,
                            c6Video;

                        beforeEach(function() {
                            c6Video = {
                                id: 'foo'
                            };

                            deferred = {
                                resolve: jasmine.createSpy('deferred.resolve(value)')
                            };

                            spyOn($q, 'defer').andReturn(deferred);
                        });

                        describe('if there is no deferred', function() {
                            beforeEach(function() {
                                _private.handleVideoReady({}, c6Video);
                            });

                            it('should create a deferred and save it to the videoDeferreds object', function() {
                                expect($q.defer).toHaveBeenCalled();
                                expect(_private.videoDeferreds.foo).toBe(deferred);
                            });

                            it('should resolve the deferred with the video', function() {
                                expect(deferred.resolve).toHaveBeenCalledWith(c6Video);
                            });
                        });

                        describe('if there is a deferred', function() {
                            beforeEach(function() {
                                _private.videoDeferreds.foo = {
                                    resolve: jasmine.createSpy('deferred.resolve(value)')
                                };

                                _private.handleVideoReady({}, c6Video);
                            });

                            it('should resolve the existing deferred', function() {
                                expect(_private.videoDeferreds.foo.resolve).toHaveBeenCalledWith(c6Video);
                            });

                            it('should not create a new deferred', function() {
                                expect($q.defer).not.toHaveBeenCalled();
                                expect(_private.videoDeferreds.foo).not.toBe(deferred);
                            });
                        });
                    });
                });

                describe('properties', function() {
                    describe('antilisteners', function() {
                        it('should be an empty array', function() {
                            expect(angular.isArray(_private.antilisteners)).toBe(true);
                            expect(_private.antilisteners.length).toBe(0);
                        });
                    });

                    describe('videoDeferreds', function() {
                        it('should be an object', function() {
                            expect(angular.isObject(_private.videoDeferreds)).toBe(true);
                        });
                    });
                });
            });

            describe('@public', function() {
                describe('methods', function() {
                    describe('bindTo(id, delegate, controller)', function() {
                        var delegate,
                            controller,
                            video;

                        beforeEach(function() {
                            video = {
                                player: {
                                    play: jasmine.createSpy('video.player.play()'),
                                    pause: jasmine.createSpy('video.player.pause()'),
                                    paused: true,
                                    currentTime: 0,
                                    duration: 60,
                                    muted: false,
                                    volume: 1
                                },
                                bufferedPercent: jasmine.createSpy('video.bufferedPercent()')
                                    .andCallFake(function() {
                                        return video._.bufferedPercent;
                                    }),
                                on: jasmine.createSpy('video.on()')
                                    .andCallFake(function(event, handler) {
                                        var handlers = video._.handlers;

                                        if (!handlers[event]) {
                                            handlers[event] = [];
                                        }

                                        handlers[event].push(handler);

                                        return video;
                                    }),
                                _: {
                                    bufferedPercent: 0.5,
                                    handlers: {},
                                    trigger: function(event) {
                                        var handlers = video._.handlers[event] || [];

                                        handlers.forEach(function(handler) {
                                            handler({ target: video.player }, video);
                                        });
                                    }
                                }
                            };

                            delegate = {};

                            controller = {
                                play: jasmine.createSpy('controller.play()'),
                                pause: jasmine.createSpy('controller.pause()'),
                                progress: jasmine.createSpy('controller.progress()'),
                                buffer: jasmine.createSpy('controller.buffer()'),
                                muteChange: jasmine.createSpy('controller.muteChange()'),
                                volumeChange: jasmine.createSpy('controller.volumeChange()')
                            };

                            spyOn(VideoService, 'getVideo').andReturn($q.when(video));
                            spyOn(_private, 'waitForController').andReturn($q.when(true));
                            $rootScope.$apply(function() {
                                VideoService.bindTo('video', delegate, controller, $scope, 'foo.ready');
                            });
                        });

                        it('should get the video', function() {
                            expect(VideoService.getVideo).toHaveBeenCalledWith('video');
                        });

                        it('should waitForController()', function() {
                            expect(_private.waitForController).toHaveBeenCalledWith($scope, 'foo.ready');
                        });

                        it('should initialize the buffer', function() {
                            expect(controller.buffer).toHaveBeenCalledWith(50);
                        });

                        describe('response to video events', function() {
                            describe('play', function() {
                                beforeEach(function() {
                                    video._.trigger('play');
                                });

                                it('should call play on the controller', function() {
                                    expect(controller.play).toHaveBeenCalled();
                                });
                            });

                            describe('pause', function() {
                                beforeEach(function() {
                                    video._.trigger('pause');
                                });

                                it('should call pause on the controller', function() {
                                    expect(controller.pause).toHaveBeenCalled();
                                });
                            });

                            describe('timeupdate', function() {
                                it('should call progress() on the controller with the percentage of the video completed', function() {
                                    function timeupdate(currentTime) {
                                        video.player.currentTime = currentTime;
                                        video._.trigger('timeupdate');
                                    }

                                    timeupdate(0);
                                    expect(controller.progress).toHaveBeenCalledWith(0);

                                    timeupdate(15);
                                    expect(controller.progress).toHaveBeenCalledWith(25);

                                    timeupdate(30);
                                    expect(controller.progress).toHaveBeenCalledWith(50);

                                    timeupdate(45);
                                    expect(controller.progress).toHaveBeenCalledWith(75);

                                    timeupdate(60);
                                    expect(controller.progress).toHaveBeenCalledWith(100);
                                });
                            });

                            describe('progress', function() {
                                it('should call buffer() on the controller with the percentage buffered', function() {
                                    function progress(bufferedPercent) {
                                        video._.bufferedPercent = bufferedPercent;
                                        video._.trigger('progress');
                                    }

                                    progress(0.1);
                                    expect(controller.buffer).toHaveBeenCalledWith(10);

                                    progress(0.45);
                                    expect(controller.buffer).toHaveBeenCalledWith(45);

                                    progress(0.77);
                                    expect(controller.buffer).toHaveBeenCalledWith(77);

                                    progress(1);
                                    expect(controller.buffer).toHaveBeenCalledWith(100);
                                });
                            });

                            describe('volumechange', function() {
                                function mute(muted) {
                                    video.player.muted = muted;
                                    video._.trigger('volumechange');
                                }

                                function volumechange(volume) {
                                    video.player.volume = volume;
                                    video._.trigger('volumechange');
                                }

                                describe('muting', function() {
                                    it('should call muteChange() on the controller with the muted value', function() {
                                        mute(true);
                                        expect(controller.muteChange).toHaveBeenCalledWith(true);

                                        mute(false);
                                        expect(controller.muteChange).toHaveBeenCalledWith(false);
                                    });
                                });

                                describe('changing volume', function() {
                                    it('should call volumeChange() on the controller with the volume percent', function() {
                                        volumechange(0.44);
                                        expect(controller.volumeChange).toHaveBeenCalledWith(44);

                                        volumechange(0.34);
                                        expect(controller.volumeChange).toHaveBeenCalledWith(34);

                                        volumechange(0);
                                        expect(controller.volumeChange).toHaveBeenCalledWith(0);
                                    });
                                });
                            });
                        });

                        describe('delegate methods', function() {
                            describe('play', function() {
                                it('should play the video', function() {
                                    delegate.play();

                                    expect(video.player.play).toHaveBeenCalled();
                                });
                            });

                            describe('pause', function() {
                                it('should pause the video', function() {
                                    delegate.pause();

                                    expect(video.player.pause).toHaveBeenCalled();
                                });
                            });

                            describe('seeking', function() {
                                describe('while playing', function() {
                                    beforeEach(function() {
                                        video.player.paused = false;
                                    });

                                    it('should pause the video when seeking starts', function() {
                                        delegate.seekStart();

                                        expect(video.player.pause).toHaveBeenCalled();
                                    });

                                    it('should call progress() on the controller in a timeout during seeking', function() {
                                        delegate.seekStart();
                                        delegate.seek({ percent: 25 });

                                        expect(controller.progress).not.toHaveBeenCalled();

                                        $timeout.flush();

                                        expect(controller.progress).toHaveBeenCalledWith(25);
                                    });

                                    it('should seek and resume the video after the seeked event is fired', function() {
                                        delegate.seekStart();
                                        delegate.seek({ percent: 25 });
                                        delegate.seekStop({ percent: 50 });

                                        expect(video.player.currentTime).toBe(30);
                                        expect(video.player.play).not.toHaveBeenCalled();

                                        video._.trigger('seeked');
                                        expect(video.player.play).toHaveBeenCalled();
                                    });
                                });

                                describe('while paused', function() {
                                    beforeEach(function() {
                                        video.player.paused = true;

                                        delegate.seekStart();
                                        delegate.seek({ percent: 50 });
                                    });

                                    it('should seek but not resume the video after seeking', function() {
                                        delegate.seekStop({ percent: 75 });

                                        expect(video.player.currentTime).toBe(45);

                                        video._.trigger('seeked');
                                        expect(video.player.play).not.toHaveBeenCalled();
                                    });
                                });
                            });

                            describe('volumeSeek', function() {
                                it('should change the volume of the player', function() {
                                    delegate.volumeSeek(75);
                                    expect(video.player.volume).toBe(0.75);

                                    delegate.volumeSeek(44);
                                    expect(video.player.volume).toBe(0.44);

                                    delegate.volumeSeek(25);
                                    expect(video.player.volume).toBe(0.25);

                                    delegate.volumeSeek(0);
                                    expect(video.player.volume).toBe(0);
                                });
                            });

                            describe('mute', function() {
                                beforeEach(function() {
                                    video.player.muted = false;

                                    delegate.mute();
                                });

                                it('should mute the video', function() {
                                    expect(video.player.muted).toBe(true);
                                });
                            });

                            describe('unmute', function() {
                                beforeEach(function() {
                                    video.player.muted = true;

                                    delegate.unmute();
                                });

                                it('should unmute the video', function() {
                                    expect(video.player.muted).toBe(false);
                                });
                            });
                        });
                    });

                    describe('listenOn(scope)', function() {
                        var scope,
                            deregisterFunction;

                        beforeEach(function() {
                            deregisterFunction = function() {};

                            scope = {
                                $on: jasmine.createSpy('scope.$on(event, handler)')
                                    .andReturn(deregisterFunction)
                            };

                            VideoService.listenOn(scope);
                        });

                        it('should listen for the video ready event', function() {
                            expect(scope.$on).toHaveBeenCalledWith('c6video-ready', _private.handleVideoReady);
                        });

                        it('should add its deregister function to the "antilisteners" array', function() {
                            expect(_private.antilisteners.indexOf(deregisterFunction)).not.toBe(-1);
                        });
                    });

                    describe('ignore()', function() {
                        var spies;

                        beforeEach(function() {
                            spies = [
                                jasmine.createSpy('deregister() [0]'),
                                jasmine.createSpy('deregister() [1]'),
                                jasmine.createSpy('deregister() [2]')
                            ];

                            _private.antilisteners.push.apply(_private.antilisteners, spies);

                            VideoService.ignore();
                        });

                        it('should call each deregister function', function() {
                            spies.forEach(function(spy) {
                                expect(spy).toHaveBeenCalled();
                            });
                        });

                        it('should empty the array', function() {
                            expect(_private.antilisteners.length).toBe(0);
                        });
                    });

                    describe('getVideo(id)', function() {
                        var deferred;

                        beforeEach(function() {
                            deferred = {
                                promise: {}
                            };

                            spyOn($q, 'defer').andReturn(deferred);
                        });

                        describe('if there is no deferred for the video', function() {
                            var result;

                            beforeEach(function() {
                                result = VideoService.getVideo('foo');
                            });

                            it('should return a promise', function() {
                                expect(result).toBe(deferred.promise);
                            });

                            it('should create a deferred for the video and add it to the videoDeferreds object', function() {
                                expect($q.defer).toHaveBeenCalled();
                                expect(_private.videoDeferreds.foo).toBe(deferred);
                            });
                        });

                        describe('if there is already a deferred for the video', function() {
                            var result;

                            beforeEach(function() {
                                _private.videoDeferreds.foo = {
                                    promise: {}
                                };

                                result = VideoService.getVideo('foo');
                            });

                            it('should not overwrite the existing promise', function() {
                                expect(_private.videoDeferreds.foo).not.toBe(deferred);
                            });

                            it('should return the already existing promise', function() {
                                expect(result).toBe(_private.videoDeferreds.foo.promise);
                            });

                            it('should not create a new deferred object', function() {
                                expect($q.defer).not.toHaveBeenCalled();
                            });
                        });
                    });
                });
            });
        });
    });
}());
