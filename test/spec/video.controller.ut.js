(function() {
    'use strict';

    define(['video'], function() {
        describe('VideoController', function() {
            var VideoCtrl,
                ExperienceCtrl,
                AppCtrl,
                $rootScope,
                appCtrlScope,
                expCtrlScope,
                $scope,
                $controller;

            var VideoService;

            beforeEach(function() {
                VideoService = {
                    bindTo: jasmine.createSpy('VideoService.bindTo()')
                };

                module('c6.screenjackinator', function($provide) {
                    $provide.value('VideoService', VideoService);
                });

                inject(function($injector) {
                    $controller = $injector.get('$controller');
                    $rootScope = $injector.get('$rootScope');

                    appCtrlScope = $rootScope.$new();
                    AppCtrl = appCtrlScope.AppCtrl = {
                        project: undefined
                    };

                    expCtrlScope = appCtrlScope.$new();
                    ExperienceCtrl = expCtrlScope.ExperienceCtrl = {};

                    $scope = expCtrlScope.$new();
                    VideoCtrl = $controller('VideoController', { $scope: $scope });
                });
            });

            it('should exist', function() {
                expect(VideoCtrl).toBeDefined();
            });

            it('should put itself on the scope', function() {
                expect($scope.VideoCtrl).toBe(VideoCtrl);
            });

            it('should bind the controls to the video', function() {
                expect(VideoService.bindTo).toHaveBeenCalledWith('video', VideoCtrl.controlsDelegate, VideoCtrl.controlsController, $scope, 'VideoCtrl.controlsController.ready');
            });

            describe('when c6Bubble:show is $emitted', function() {
                describe('if the video doesn\'t exist', function() {
                    it('should do nothing', function() {
                        expect(function() {
                            $scope.$emit('c6Bubble:show', {});
                        }).not.toThrow();
                    });
                });

                describe('when the video does exist', function() {
                    var annotation;

                    beforeEach(function() {
                        annotation = {
                            sfx: {
                                play: jasmine.createSpy('annotation.sfx.play()')
                            }
                        };

                        ExperienceCtrl.video = {
                            player: {
                                paused: true
                            }
                        };
                    });

                    describe('if the video player is paused', function() {
                        beforeEach(function() {
                            $scope.$emit('c6Bubble:show', annotation);
                        });

                        it('should not play the sound', function() {
                            expect(annotation.sfx.play).not.toHaveBeenCalled();
                        });
                    });

                    describe('if the video player is playing', function() {
                        beforeEach(function() {
                            ExperienceCtrl.video.player.paused = false;
                            $scope.$emit('c6Bubble:show', annotation);
                        });

                        it('should play the sfx if there is one', function() {
                            expect(annotation.sfx.play).toHaveBeenCalled();

                            annotation.sfx = null;

                            expect(function() {
                                $scope.$emit('c6Bubble:show', annotation);
                            }).not.toThrow();
                        });
                    });
                });
            });

            describe('properties', function() {
                describe('controlsDelegate', function() {
                    it('should be an empty object', function() {
                        expect(angular.equals(VideoCtrl.controlsDelegate, {})).toBe(true);
                    });
                });

                describe('controlsController', function() {
                    it('should be an empty object', function() {
                        expect(angular.equals(VideoCtrl.controlsController, {})).toBe(true);
                    });
                });
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
                        var video;

                        beforeEach(function() {
                            video = ExperienceCtrl.video = {
                                player: {
                                    currentTime: 0
                                }
                            };
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
        });
    });
}());
