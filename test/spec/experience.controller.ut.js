(function() {
    'use strict';

    define(['experience'], function() {
        describe('ExperienceController', function() {
            var $rootScope,
                appCtrlScope,
                $scope,
                $controller,
                ExperienceCtrl;

            var VideoService,
                video,
                AppCtrl;

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
                    $rootScope = $injector.get('$rootScope');
                    $controller = $injector.get('$controller');

                    appCtrlScope = $rootScope.$new();
                    AppCtrl = appCtrlScope.AppCtrl = {
                        project: undefined
                    };

                    $scope = appCtrlScope.$new();
                    ExperienceCtrl = $controller('ExperienceController', { $scope: $scope });
                });
            });

            it('should exist', function() {
                expect(ExperienceCtrl).toBeDefined();
            });

            it('should put itself on the scope', function() {
                expect($scope.ExperienceCtrl).toBe(ExperienceCtrl);
            });

            it('should cause a $digest when the timeupdate event fires', function() {
                $scope.$apply(function() {
                    VideoService._.getVideoDeferred.resolve(video);
                });

                expect(video.on).toHaveBeenCalledWith('timeupdate', angular.noop);
            });

            it('should make the video available', function() {
                $scope.$apply(function() {
                    VideoService._.getVideoDeferred.resolve(video);
                });

                expect(ExperienceCtrl.video).toBe(video);
            });

            describe('when c6Bubble:show is $emitted', function() {
                var annotation,
                    boundingBox,
                    childScope;

                beforeEach(function() {
                    annotation = {};
                    boundingBox = {};
                    childScope = $scope.$new();

                    spyOn($scope, '$broadcast').andCallThrough();

                    childScope.$emit('c6Bubble:show', annotation, boundingBox);
                });

                it('should $broadcast the event so everybody in the experience knows', function() {
                    expect($scope.$broadcast).toHaveBeenCalledWith('c6Bubble:show', annotation, boundingBox);
                });
            });

            describe('when c6Bubble:editdone is $emitted', function() {
                beforeEach(function() {
                    ExperienceCtrl.showWizard = true;

                    $scope.$emit('c6Bubble:editdone', {});
                });

                it('should stop the wizard', function() {
                    expect(ExperienceCtrl.showWizard).toBe(false);
                });
            });

            describe('methods', function() {
                describe('skipWizard()', function() {
                    it('should close the welcome message', function() {
                        expect(ExperienceCtrl.showWelcome).toBe(true);
                        expect(ExperienceCtrl.showWizard).toBe(false);

                        ExperienceCtrl.skipWizard();

                        expect(ExperienceCtrl.showWelcome).toBe(false);
                        expect(ExperienceCtrl.showWizard).toBe(false);
                    });
                });

                describe('startWizard()', function() {
                    beforeEach(function() {
                        expect(ExperienceCtrl.showWelcome).toBe(true);
                        expect(ExperienceCtrl.showWizard).toBe(false);

                        ExperienceCtrl.video = {
                            player: {
                                currentTime: 30,
                                play: jasmine.createSpy('player.play()')
                            }
                        };

                        ExperienceCtrl.startWizard();
                    });

                    it('should close the welcome message and start the wizard', function() {
                        expect(ExperienceCtrl.showWelcome).toBe(false);
                        expect(ExperienceCtrl.showWizard).toBe(true);
                    });

                    it('should rewind the video to the beginning', function() {
                        expect(ExperienceCtrl.video.player.currentTime).toBe(0);
                    });

                    it('should start the video', function() {
                        expect(ExperienceCtrl.video.player.play).toHaveBeenCalled();
                    });
                });

                describe('jumpTo(annotation)', function() {
                    describe('if there is no video', function() {
                        it('should do nothing', function() {
                            expect(function() {
                                ExperienceCtrl.jumpTo({ timestamp: 5 });
                            }).not.toThrow();
                        });
                    });

                    describe('if there is a video', function() {
                        beforeEach(function() {
                            $scope.$apply(function() {
                                VideoService._.getVideoDeferred.resolve(video);
                            });
                        });

                        it('should set the video\'s currentTime to the timestamp of the annotation', function() {
                            ExperienceCtrl.jumpTo({ timestamp: 10 });
                            expect(video.player.currentTime).toBe(10);

                            ExperienceCtrl.jumpTo({ timestamp: 20 });
                            expect(video.player.currentTime).toBe(20);

                            ExperienceCtrl.jumpTo({ timestamp: 53 });
                            expect(video.player.currentTime).toBe(53);
                        });
                    });
                });
            });

            describe('properties', function() {
                describe('showWelcome', function() {
                    it('should be true', function() {
                        expect(ExperienceCtrl.showWelcome).toBe(true);
                    });
                });

                describe('showWizard', function() {
                    it('should be false', function() {
                        expect(ExperienceCtrl.showWizard).toBe(false);
                    });
                });

                describe('annotations()', function() {
                    it('should be null if the AppCtrl has no project', function() {
                        expect(ExperienceCtrl.annotations()).toBe(null);
                    });

                    it('should be a reference to the annotations if there is a project', function() {
                        $scope.$apply(function() {
                            AppCtrl.project = {
                                annotations: []
                            };
                        });

                        expect(ExperienceCtrl.annotations()).toBe(AppCtrl.project.annotations);
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
                        var bubbles = ExperienceCtrl.bubbles();

                        expect(bubbles[0]).toBe(annotations[0]);
                        expect(bubbles[1]).toBe(annotations[3]);
                        expect(bubbles[2]).toBe(annotations[4]);
                        expect(bubbles.length).toBe(3);
                    });

                    it('should be an empty array if annotations is undefined', function() {
                        $scope.$apply(function() {
                            AppCtrl.project.annotations = undefined;
                        });

                        expect(function() { ExperienceCtrl.bubbles(); }).not.toThrow();
                        expect(ExperienceCtrl.bubbles().length).toBe(0);
                        expect(angular.isArray(ExperienceCtrl.bubbles())).toBe(true);
                    });
                });
            });
        });
    });
}());
