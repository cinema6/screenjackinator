(function() {
    'use strict';

    define(['player'], function() {
        describe('PlayerController', function() {
            var $rootScope,
                $scope,
                $controller,
                $timeout,
                PlayerCtrl;

            var VideoService,
                fail,
                video,
                videoEvents;

            function resolveVideo() {
                $rootScope.$apply(function() {
                    VideoService._.getVideoDeferred.resolve(video);
                });
            }

            beforeEach(function() {
                fail = jasmine.createSpy('fail()');

                videoEvents = {
                    ended: [],
                    timeupdate: []
                };

                video = {
                    on: jasmine.createSpy('video.on()')
                        .andCallFake(function(event, handler) {
                            videoEvents[event].push(handler);
                            return video;
                        }),
                    off: jasmine.createSpy('video.off()')
                        .andCallFake(function(event, handler) {
                            var handlers = videoEvents[event];

                            handlers.splice(handlers.indexOf(handler), 1);
                            return video;
                        }),
                    trigger: function(event) {
                        $scope.$apply(function() {
                            videoEvents[event].forEach(function(handler) {
                                handler({ target: video.player }, video);
                            });
                        });
                    },
                    player: {
                        play: jasmine.createSpy('player.play()'),
                        currentTime: 10
                    }
                };

                module('c6.screenjackinator', function($provide) {
                    $provide.factory('VideoService', function($q) {
                        VideoService = {
                            getVideo: jasmine.createSpy('VideoService.getVideo()')
                                .andCallFake(function() {
                                    return VideoService._.getVideoDeferred.promise;
                                }),
                            _: {
                                getVideoDeferred: $q.defer()
                            }
                        };

                        return VideoService;
                    });
                    $provide.value('fail', fail);
                });

                inject(function($injector) {
                    $rootScope = $injector.get('$rootScope');
                    $controller = $injector.get('$controller');
                    $timeout = $injector.get('$timeout');

                    $scope = $rootScope.$new();
                    PlayerCtrl = $controller('PlayerController', { $scope: $scope });
                });
            });

            it('should exist', function() {
                expect(PlayerCtrl).toBeDefined();
            });

            it('should put itself on the $scope', function() {
                expect($scope.PlayerCtrl).toBe(PlayerCtrl);
            });

            describe('before siteTransitionComplete is $broadcasted', function() {
                it('should not get the video', function() {
                    expect(VideoService.getVideo).not.toHaveBeenCalled();
                });
            });

            describe('after siteTransitionComplete is $broadcasted', function() {
                beforeEach(function() {
                    $rootScope.$broadcast('siteTransitionComplete');
                });

                it('should get the video', function() {
                    expect(VideoService.getVideo).toHaveBeenCalledWith('video');
                });

                describe('if getting the video fails', function() {
                    beforeEach(function() {
                        $scope.$apply(function() {
                            VideoService._.getVideoDeferred.reject('error');
                        });
                    });

                    it('should fail', function() {
                        expect(fail).toHaveBeenCalledWith('error');
                    });
                });

                describe('after the video is fetched', function() {
                    beforeEach(resolveVideo);

                    it('should listen for the "ended" event', function() {
                        expect(video.on).toHaveBeenCalledWith('ended', jasmine.any(Function));
                    });

                    describe('after the "ended" event fires', function() {
                        beforeEach(function() {
                            video.trigger('ended');
                        });

                        it('should show the end options', function() {
                            expect(PlayerCtrl.showEnd).toBe(true);
                        });

                        it('should attach a listener for the timeupdate event', function() {
                            expect(video.on).toHaveBeenCalledWith('timeupdate', jasmine.any(Function));
                        });

                        describe('when timeupdate fires', function() {
                            beforeEach(function() {
                                video.trigger('timeupdate');
                            });

                            it('should hide the end options', function() {
                                expect(PlayerCtrl.showEnd).toBe(false);
                            });

                            it('should remove the listener for the "timeupdate" event', function() {
                                expect(video.off).toHaveBeenCalledWith('timeupdate', jasmine.any(Function));
                                expect(videoEvents.timeupdate.length).toBe(0);
                            });
                        });
                    });
                });
            });

            describe('properties', function() {
                describe('showEnd', function() {
                    it('should be false', function() {
                        expect(PlayerCtrl.showEnd).toBe(false);
                    });
                });
            });
        });
    });
}());
