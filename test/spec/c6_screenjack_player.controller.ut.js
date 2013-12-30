(function() {
    'use strict';

    define(['screenjack_player'], function() {
        describe('C6ScreenjackPlayerController', function() {
            var C6ScreenjackPlayerCtrl,
                AppCtrl,
                $rootScope,
                appCtrlScope,
                expCtrlScope,
                $scope,
                $controller;

            var VideoService;

            beforeEach(function() {
                module('c6.screenjackinator', function($provide) {
                    $provide.factory('VideoService', function($q) {
                        VideoService = {
                            bindTo: jasmine.createSpy('VideoService.bindTo()'),
                            listenOn: jasmine.createSpy('VideoService.listenOn()'),
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
                });

                inject(function($injector) {
                    $controller = $injector.get('$controller');
                    $rootScope = $injector.get('$rootScope');

                    appCtrlScope = $rootScope.$new();
                    AppCtrl = appCtrlScope.AppCtrl = {
                        project: undefined
                    };

                    expCtrlScope = appCtrlScope.$new();

                    $scope = expCtrlScope.$new();
                    C6ScreenjackPlayerCtrl = $controller('C6ScreenjackPlayerController', { $scope: $scope });
                });
            });

            it('should exist', function() {
                expect(C6ScreenjackPlayerCtrl).toBeDefined();
            });

            it('should put itself on the scope', function() {
                expect($scope.Ctrl).toBe(C6ScreenjackPlayerCtrl);
            });

            it('should have the video service listen on its scope', function() {
                expect(VideoService.listenOn).toHaveBeenCalledWith($scope);
            });

            it('should get the video', function() {
                expect(VideoService.getVideo).toHaveBeenCalledWith('video');
            });

            it('should bind the controls to the video', function() {
                expect(VideoService.bindTo).toHaveBeenCalledWith('video', C6ScreenjackPlayerCtrl.controlsDelegate, C6ScreenjackPlayerCtrl.controlsController, $scope, 'Ctrl.controlsController.ready');
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
                    var annotation,
                        video;

                    beforeEach(function() {
                        annotation = {
                            sfx: {
                                play: jasmine.createSpy('annotation.sfx.play()')
                            }
                        };

                        video = {
                            player: {
                                paused: true
                            }
                        };

                        $scope.$apply(function() {
                            VideoService._.getVideoDeferred.resolve(video);
                        });
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
                            video.player.paused = false;
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
                describe('bubbles()', function() {
                    var annotations;

                    beforeEach(function() {
                        $scope.$apply(function() {
                            annotations = $scope.annotations = [
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
                            ];
                        });
                    });

                    it('should be an array of just the popup annotations', function() {
                        var bubbles = C6ScreenjackPlayerCtrl.bubbles();

                        expect(bubbles[0]).toBe(annotations[0]);
                        expect(bubbles[1]).toBe(annotations[3]);
                        expect(bubbles[2]).toBe(annotations[4]);
                        expect(bubbles.length).toBe(3);
                    });

                    it('should be an empty array if annotations is undefined', function() {
                        $scope.$apply(function() {
                            $scope.annotations = undefined;
                        });

                        expect(function() { C6ScreenjackPlayerCtrl.bubbles(); }).not.toThrow();
                        expect(C6ScreenjackPlayerCtrl.bubbles().length).toBe(0);
                        expect(angular.isArray(C6ScreenjackPlayerCtrl.bubbles())).toBe(true);
                    });
                });

                describe('controlsDelegate', function() {
                    it('should be an empty object', function() {
                        expect(angular.equals(C6ScreenjackPlayerCtrl.controlsDelegate, {})).toBe(true);
                    });

                    describe('when nodeClicked(node) is called', function() {
                        var nodes,
                            delegate;

                        beforeEach(function() {
                            delegate = C6ScreenjackPlayerCtrl.controlsDelegate;

                            nodes = [
                                { annotation: {} },
                                { annotation: {} }
                            ];

                            spyOn(C6ScreenjackPlayerCtrl, 'jumpTo');
                        });

                        it('should call jumpTo(annotation) on the ExperienceCtrl with the annotation', function() {
                            nodes.forEach(function(node) {
                                delegate.nodeClicked(node);
                                expect(C6ScreenjackPlayerCtrl.jumpTo).toHaveBeenCalledWith(node.annotation);
                            });
                        });
                    });
                });

                describe('controlsController', function() {
                    it('should be an empty object', function() {
                        expect(angular.equals(C6ScreenjackPlayerCtrl.controlsController, {})).toBe(true);
                    });
                });

                describe('controlsNodes()', function() {
                    describe('if there is no video', function() {
                        it('should be an empty array', function() {
                            var nodes = C6ScreenjackPlayerCtrl.controlsNodes();

                            expect(angular.isArray(nodes)).toBe(true);
                            expect(nodes.length).toBe(0);
                        });
                    });

                    describe('if there are no annotations', function() {
                        beforeEach(function() {
                            $scope.annotations = null;
                        });

                        it('should be an empty array', function() {
                            var nodes = C6ScreenjackPlayerCtrl.controlsNodes();

                            expect(angular.isArray(nodes)).toBe(true);
                            expect(nodes.length).toBe(0);
                        });
                    });

                    describe('if there are annotations and a video', function() {
                        beforeEach(function() {
                            var annotations = [
                                {
                                    timestamp: 5
                                },
                                {
                                    timestamp: 23
                                },
                                {
                                    timestamp: 40
                                },
                                {
                                    timestamp: 50
                                }
                            ];

                            $scope.annotations = annotations;

                            $scope.$apply(function() {
                                VideoService._.getVideoDeferred.resolve({
                                    player: {
                                        duration: 60
                                    }
                                });
                            });
                        });

                        it('should generate a node for every annotation', function() {
                            var nodes = C6ScreenjackPlayerCtrl.controlsNodes(),
                                node0 = nodes[0],
                                node1 = nodes[1],
                                node2 = nodes[2],
                                node3 = nodes[3];

                            expect(nodes.length).toBe(4);

                            nodes.forEach(function(node, index) {
                                expect(node.style).toBe('scene');
                                expect(node.text).toBe((index + 1).toString());
                                expect(node.annotation).toBe($scope.annotations[index]);
                            });

                            expect(node0.position).toBeCloseTo(8, 0);
                            expect(node1.position).toBeCloseTo(38, 0);
                            expect(node2.position).toBeCloseTo(66.6, 0);
                            expect(node3.position).toBeCloseTo(83, 0);
                        });
                    });
                });
            });

            describe('methods', function() {
                describe('jumpTo(annotation)', function() {
                    describe('if there is no video', function() {
                        it('should do nothing', function() {
                            expect(function() {
                                C6ScreenjackPlayerCtrl.jumpTo({ timestamp: 5 });
                            }).not.toThrow();
                        });
                    });

                    describe('if there is a video', function() {
                        var video;

                        beforeEach(function() {
                            video = {
                                player: {
                                    currentTime: 0
                                }
                            };

                            $scope.$apply(function() {
                                VideoService._.getVideoDeferred.resolve(video);
                            });
                        });

                        it('should set the video\'s currentTime to the timestamp of the annotation', function() {
                            C6ScreenjackPlayerCtrl.jumpTo({ timestamp: 10 });
                            expect(video.player.currentTime).toBe(10);

                            C6ScreenjackPlayerCtrl.jumpTo({ timestamp: 20 });
                            expect(video.player.currentTime).toBe(20);

                            C6ScreenjackPlayerCtrl.jumpTo({ timestamp: 53 });
                            expect(video.player.currentTime).toBe(53);
                        });
                    });
                });

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
                                expect(C6ScreenjackPlayerCtrl.annotationIsActive(annotation)).toBe(false);
                            });
                        });
                    });

                    describe('if there is a video', function() {
                        var video;

                        beforeEach(function() {
                            video = {
                                player: {
                                    currentTime: 0
                                }
                            };

                            $scope.$apply(function() {
                                VideoService._.getVideoDeferred.resolve(video);
                            });
                        });

                        it('should return true when the currentTime is in-between an annotation\'s timestamp and timestamp + duration', function() {
                            function expectShown(desiredAnnotations) {
                                annotations.forEach(function(annotation) {
                                    var desiredResult = (desiredAnnotations.indexOf(annotation) > -1);

                                    expect(C6ScreenjackPlayerCtrl.annotationIsActive(annotation)).toBe(desiredResult);
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
