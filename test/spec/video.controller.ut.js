(function() {
    'use strict';

    define(['video'], function() {
        describe('VideoController', function() {
            var VideoCtrl,
                AppCtrl,
                $rootScope,
                appCtrlScope,
                $scope,
                $controller;

            var VideoService,
                video;

            beforeEach(function() {
                video = {
                    player: {
                        currentTime: 0
                    },
                    on: jasmine.createSpy('video.on()')
                };

                module('c6.screenjackinator', function($provide) {
                    $provide.factory('VideoService', function($q) {
                        VideoService = {
                            getVideo: jasmine.createSpy('VideoService.getVideo(id)')
                                .andCallFake(function() {
                                    return VideoService._.getVideoDeferred.promise;
                                }),
                            _: {
                                getVideoDeferred: $q.defer()
                            }
                        };

                        return VideoService;
                    });
                });

                inject(function($injector) {
                    $controller = $injector.get('$controller');
                    $rootScope = $injector.get('$rootScope');

                    appCtrlScope = $rootScope.$new();
                    $scope = appCtrlScope.$new();
                    VideoCtrl = $controller('VideoController', { $scope: $scope });
                });

                $scope.$apply(function() {
                    AppCtrl = appCtrlScope.AppCtrl = {
                        project: undefined
                    };
                });
            });

            it('should exist', function() {
                expect(VideoCtrl).toBeDefined();
            });

            it('should put itself on the scope', function() {
                expect($scope.VideoCtrl).toBe(VideoCtrl);
            });

            it('should cause a $digest when the timeupdate event fires', function() {
                $scope.$apply(function() {
                    VideoService._.getVideoDeferred.resolve(video);
                });

                expect(video.on).toHaveBeenCalledWith('timeupdate', angular.noop);
            });

            describe('methods', function() {
                describe('annotationIsActive(annotation)', function() {
                    var annotations;

                    beforeEach(function() {
                        annotations = [
                            {
                                timestamp: 2,
                                duration: 2
                            },
                            {
                                timestamp: 20,
                                duration: 5
                            },
                            {
                                timestamp: 60,
                                duration: 1
                            }
                        ];
                    });

                    describe('if there is no video yet', function() {
                        it('should be false', function() {
                            annotations.forEach(function(annotation) {
                                expect(VideoCtrl.annotationIsActive(annotation)).toBe(false);
                            });
                        });
                    });

                    describe('if there is a video', function() {
                        beforeEach(function() {
                            $rootScope.$apply(function() {
                                VideoService._.getVideoDeferred.resolve(video);
                            });
                        });

                        it('should return true when the currentTime is in-between an annotation\'s timestamp and timestamp + duration', function() {
                            function expectShown(desiredAnnotations) {
                                annotations.forEach(function(annotation) {
                                    var desiredResult = (desiredAnnotations.indexOf(annotation) > -1);

                                    expect(VideoCtrl.annotationIsActive(annotation)).toBe(desiredResult);
                                });
                            }

                            video.player.currentTime = 0;
                            expectShown([]);

                            video.player.currentTime = 2;
                            expectShown([annotations[0]]);

                            video.player.currentTime = 3.5;
                            expectShown([annotations[0]]);

                            video.player.currentTime = 10;
                            expectShown([]);

                            video.player.currentTime = 24;
                            expectShown([annotations[1]]);

                            video.player.currentTime = 55;
                            expectShown([]);

                            video.player.currentTime = 61;
                            expectShown([annotations[2]]);
                        });
                    });
                });
            });

            describe('properties', function() {
                describe('annotations()', function() {
                    it('should be null if the AppCtrl has no project', function() {
                        expect(VideoCtrl.annotations()).toBe(null);
                    });

                    it('should be a reference to the annotations if there is a project', function() {
                        $scope.$apply(function() {
                            AppCtrl.project = {
                                annotations: []
                            };
                        });

                        expect(VideoCtrl.annotations()).toBe(AppCtrl.project.annotations);
                    });
                });

                describe('bubbles()', function() {
                    var annotations;

                    beforeEach(function() {
                        $scope.$apply(function() {
                            AppCtrl.project = {
                                annotations: [
                                    {
                                        type: 'popup'
                                    },
                                    {
                                        type: 'tts'
                                    },
                                    {
                                        type: 'tts'
                                    },
                                    {
                                        type: 'popup'
                                    },
                                    {
                                        type: 'popup'
                                    }
                                ]
                            };

                            annotations = AppCtrl.project.annotations;
                        });
                    });

                    it('should be an array of just the popup annotations', function() {
                        var bubbles = VideoCtrl.bubbles();

                        expect(bubbles[0]).toBe(annotations[0]);
                        expect(bubbles[1]).toBe(annotations[3]);
                        expect(bubbles[2]).toBe(annotations[4]);
                        expect(bubbles.length).toBe(3);
                    });

                    it('should be an empty array if annotations is undefined', function() {
                        $scope.$apply(function() {
                            AppCtrl.project.annotations = undefined;
                        });

                        expect(function() { VideoCtrl.bubbles(); }).not.toThrow();
                        expect(VideoCtrl.bubbles().length).toBe(0);
                        expect(angular.isArray(VideoCtrl.bubbles())).toBe(true);
                    });
                });
            });
        });
    });
}());
