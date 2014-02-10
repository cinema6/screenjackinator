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

            describe('when c6Annotation:show is $emitted', function() {
                var annotation,
                    boundingBox,
                    childScope;

                beforeEach(function() {
                    annotation = {};
                    boundingBox = {};
                    childScope = $scope.$new();

                    spyOn($scope, '$broadcast').andCallThrough();

                    childScope.$emit('c6Annotation:show', annotation, boundingBox);
                });

                it('should $broadcast the event so everybody in the experience knows', function() {
                    expect($scope.$broadcast).toHaveBeenCalledWith('c6Annotation:show', annotation, boundingBox);
                });
            });

            describe('when c6Annotation:editdone is $emitted', function() {
                beforeEach(function() {
                    spyOn(ExperienceCtrl, 'endWizard');
                });

                describe('if the wizard is running', function() {
                    beforeEach(function() {
                        ExperienceCtrl.showWizard = true;

                        $scope.$emit('c6Annotation:editdone', {});
                    });

                    it('should stop the wizard', function() {
                        expect(ExperienceCtrl.endWizard).toHaveBeenCalled();
                    });
                });

                describe('if the wizard isn\'t running', function() {
                    beforeEach(function() {
                        ExperienceCtrl.showWizard = false;

                        $scope.$emit('c6Annotation:editdone', {});
                    });

                    it('should do nothing', function() {
                        expect(ExperienceCtrl.endWizard).not.toHaveBeenCalled();
                    });
                });
            });

            describe('when c6Annotation:editstart is $emitted', function() {
                beforeEach(function() {
                    ExperienceCtrl.video = {
                        player: {
                            pause: jasmine.createSpy('player.pause()')
                        }
                    };

                    $scope.$emit('c6Annotation:editstart', {}, {});
                });

                it('should pause the player', function() {
                    expect(ExperienceCtrl.video.player.pause).toHaveBeenCalled();
                });
            });

            describe('methods', function() {
                describe('preview(annotation)', function() {
                    var handler;

                    function timeupdate(time) {
                        ExperienceCtrl.video.player.currentTime = time;
                        handler({ target: ExperienceCtrl.video.player });
                    }

                    beforeEach(function() {
                        ExperienceCtrl.video = {
                            on: jasmine.createSpy('video.on()')
                                .andCallFake(function(event, handlerFn) {
                                    if (event === 'timeupdate') {
                                        handler = handlerFn;
                                    }
                                }),
                            off: jasmine.createSpy('video.off()')
                                .andCallFake(function(event, handlerFn) {
                                    if (event === 'timeupdate' && handler === handlerFn) {
                                        handler = undefined;
                                    }
                                }),
                            player: {
                                currentTime: 0,
                                play: jasmine.createSpy('player.play()'),
                                pause: jasmine.createSpy('player.pause()')
                            }
                        };

                        ExperienceCtrl.preview({
                            timestamp: 10,
                            duration: 4
                        });
                    });

                    it('should rewind the video 2 seconds before the annotation', function() {
                        expect(ExperienceCtrl.video.player.currentTime).toBe(8);
                    });

                    it('should play the video', function() {
                        expect(ExperienceCtrl.video.player.play).toHaveBeenCalled();
                    });

                    describe('after playing the video', function() {
                        it('should pause the video one second after the annotation ends', function() {
                            function updateAndExpect(time, showExpect) {
                                timeupdate(time);

                                if (showExpect) {
                                    expect(ExperienceCtrl.video.player.pause).toHaveBeenCalled();
                                } else {
                                    expect(ExperienceCtrl.video.player.pause).not.toHaveBeenCalled();
                                }
                            }

                            updateAndExpect(8);
                            updateAndExpect(9);
                            updateAndExpect(10);
                            updateAndExpect(12);
                            updateAndExpect(14);
                            updateAndExpect(16, true);
                            expect(handler).toBeUndefined();
                        });
                    });

                    describe('if the annotation\'s timestamp is less than 2', function() {
                        beforeEach(function() {
                            ExperienceCtrl.preview({
                                timestamp: 1.5,
                                duration: 3
                            });
                        });

                        it('should rewind the video to 0', function() {
                            expect(ExperienceCtrl.video.player.currentTime).not.toBeLessThan(0);
                            expect(ExperienceCtrl.video.player.currentTime).toBe(0);
                        });
                    });
                });

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

                describe('endWizard()', function() {
                    beforeEach(function() {
                        ExperienceCtrl.video = {
                            player: {
                                play: jasmine.createSpy('player.play()')
                            }
                        };

                        ExperienceCtrl.showWizard = true;

                        ExperienceCtrl.endWizard();
                    });

                    it('should hide the wizard', function() {
                        expect(ExperienceCtrl.showWizard).toBe(false);
                    });

                    it('should play the video', function() {
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
                        expect(ExperienceCtrl.annotations).toBe(null);
                    });

                    it('should be a reference to the annotations if there is a project', function() {
                        $scope.$apply(function() {
                            AppCtrl.project = {
                                annotations: []
                            };
                        });

                        expect(ExperienceCtrl.annotations).toBe(AppCtrl.project.annotations);
                    });
                });
            });
        });
    });
}());
