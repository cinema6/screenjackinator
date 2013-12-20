(function() {
    'use strict';

    define(['app'], function() {
        describe('VideoService', function() {
            var VideoService,
                $q;

            var _private;

            beforeEach(function() {
                module('c6.screenjackinator');

                inject(function($injector) {
                    VideoService = $injector.get('VideoService');
                    _private = VideoService._private;

                    $q = $injector.get('$q');
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
