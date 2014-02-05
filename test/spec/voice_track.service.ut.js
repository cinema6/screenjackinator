(function() {
    'use strict';

    define(['services'], function() {
        describe('VoiceTrackService', function() {
            var VoiceTrackService,
                $rootScope,
                $q;

            var Annotation;

            beforeEach(function() {
                module('c6.screenjackinator.services');

                inject(function($injector) {
                    VoiceTrackService = $injector.get('VoiceTrackService');
                    $q = $injector.get('$q');
                    $rootScope = $injector.get('$rootScope');

                    Annotation = function(config, duration) {
                        var getMP3Deferred,
                            self = this;

                        angular.extend(this, config);

                        this._voiceBox = {
                            paused: true,
                            ended: false,
                            play: jasmine.createSpy('voiceBox.play()')
                                .andCallFake(function() {
                                    self._voiceBox.paused = false;
                                }),
                            pause: jasmine.createSpy('voiceBox.pause()')
                                .andCallFake(function() {
                                    self._voiceBox.paused = true;
                                }),
                            duration: duration,
                            currentTime: 0
                        };

                        this.getMP3 = jasmine.createSpy('annotation.getMP3()')
                            .andCallFake(function() {
                                getMP3Deferred = $q.defer();

                                return getMP3Deferred.promise;
                            });

                        this.resolveGetMP3 = function() {
                            $rootScope.$apply(function() {
                                getMP3Deferred.resolve(this);
                            });
                        };
                    };
                });
            });

            it('should exist', function() {
                expect(VoiceTrackService).toBeDefined();
            });

            describe('@public', function() {
                describe('properties', function() {
                    describe('paused', function() {
                        it('should be initialized to true', function() {
                            expect(VoiceTrackService.paused).toBe(true);
                        });

                        it('should be read-only', function() {
                            expect(function() {
                                VoiceTrackService.paused = false;
                            }).toThrow();
                        });
                    });

                    describe('annotations', function() {
                        it('should be initialized to an empty array', function() {
                            expect(VoiceTrackService.annotations).toEqual([]);
                        });

                        it('should be read-only', function() {
                            expect(function() {
                                VoiceTrackService.annotations = 'foo';
                            }).toThrow();
                        });
                    });

                    describe('ready', function() {
                        it('should be initialized to false', function() {
                            expect(VoiceTrackService.ready).toBe(false);
                        });

                        it('should be read-only', function() {
                            expect(function() {
                                VoiceTrackService.ready = true;
                            }).toThrow();
                        });
                    });

                    describe('currentTime', function() {
                        it('should be initialized to 0', function() {
                            expect(VoiceTrackService.currentTime).toBe(0);
                        });

                        it('should be read-only', function() {
                            expect(function() {
                                VoiceTrackService.currentTime = 10;
                            }).toThrow();
                        });
                    });
                });

                describe('methods', function() {
                    describe('init(annotations)', function() {
                        var annotations,
                            result,
                            spy;

                        beforeEach(function() {
                            spy = jasmine.createSpy('promise spy');

                            annotations = [
                                new Annotation(),
                                new Annotation(),
                                new Annotation()
                            ];

                            result = VoiceTrackService.init(annotations);
                            result.then(spy);
                        });

                        it('should set the annotations property', function() {
                            expect(VoiceTrackService.annotations).toBe(annotations);
                        });

                        it('should return a promise', function() {
                            expect(angular.isFunction(result.then)).toBe(true);
                        });

                        it('should getMP3s for every annotation', function() {
                            annotations.forEach(function(annotation) {
                                expect(annotation.getMP3).toHaveBeenCalled();
                            });
                        });

                        it('should resolve the promise after all the annotations have MP3s', function() {
                            expect(spy).not.toHaveBeenCalled();

                            annotations[0].resolveGetMP3();
                            expect(spy).not.toHaveBeenCalled();

                            annotations[1].resolveGetMP3();
                            expect(spy).not.toHaveBeenCalled();

                            annotations[2].resolveGetMP3();
                            expect(spy).toHaveBeenCalledWith(VoiceTrackService);
                        });
                    });

                    describe('play()', function() {
                        beforeEach(function() {
                            spyOn(VoiceTrackService, 'tick');
                            VoiceTrackService.play();
                        });

                        it('should set paused to false', function() {
                            expect(VoiceTrackService.paused).toBe(false);
                        });

                        it('should call tick() with the currentTime', function() {
                            expect(VoiceTrackService.tick).toHaveBeenCalledWith(VoiceTrackService.currentTime);
                        });
                    });

                    describe('pause()', function() {
                        var annotations;

                        beforeEach(function() {
                            annotations = [
                                new Annotation(),
                                new Annotation()
                            ];

                            VoiceTrackService.init(annotations);
                            VoiceTrackService.pause();
                        });

                        it('should set paused to true', function() {
                            expect(VoiceTrackService.paused).toBe(true);
                        });

                        it('should pause all the players', function() {
                            annotations.forEach(function(annotation) {
                                expect(annotation._voiceBox.pause).toHaveBeenCalled();
                            });
                        });
                    });

                    describe('tick(time)', function() {
                        var annotations;

                        beforeEach(function() {
                            annotations = [
                                new Annotation({
                                    timestamp: 5
                                }, 7),
                                new Annotation({
                                    timestamp: 15
                                }, 3),
                                new Annotation({
                                    timestamp: 37
                                }, 33)
                            ];

                            VoiceTrackService.init(annotations);
                        });

                        it('should set the currentTime', function() {
                            VoiceTrackService.tick(10);
                            expect(VoiceTrackService.currentTime).toBe(10);

                            VoiceTrackService.tick(24);
                            expect(VoiceTrackService.currentTime).toBe(24);
                        });

                        describe('if paused', function() {
                            it('should sync the currentTime of the voiceBoxs to the supplied time', function() {
                                function assertCurrentTime(times) {
                                    times.forEach(function(time, index) {
                                        expect(annotations[index]._voiceBox.currentTime).toBe(time);
                                    });
                                }

                                VoiceTrackService.tick(0);
                                assertCurrentTime([0, 0, 0]);

                                VoiceTrackService.tick(5);
                                assertCurrentTime([0, 0, 0]);

                                VoiceTrackService.tick(7);
                                assertCurrentTime([2, 0, 0]);

                                VoiceTrackService.tick(11);
                                assertCurrentTime([6, 0, 0]);

                                VoiceTrackService.tick(13);
                                assertCurrentTime([0, 0, 0]);

                                VoiceTrackService.tick(16);
                                assertCurrentTime([0, 1, 0]);

                                VoiceTrackService.tick(40);
                                assertCurrentTime([0, 0, 3]);

                                VoiceTrackService.tick(69);
                                assertCurrentTime([0, 0, 32]);

                                VoiceTrackService.tick(75);
                                assertCurrentTime([0, 0, 0]);
                            });
                        });

                        describe('if playing', function() {
                            beforeEach(function() {
                                VoiceTrackService.play();
                            });

                            it('should play annotations that should be playing', function() {
                                function tick(time) {
                                    annotations.forEach(function(annotation) {
                                        var voiceBox = annotation._voiceBox,
                                            shouldPlay = (time >= annotation.timestamp) && (time < (annotation.timestamp + voiceBox.duration));

                                        if(!shouldPlay) {
                                            voiceBox.paused = true;
                                        }
                                        if(!voiceBox.paused) {
                                            if(!shouldPlay) {
                                                voiceBox.ended = true;
                                            }
                                        }
                                    });

                                    VoiceTrackService.tick(time);
                                }

                                function assertPaused(statuses) {
                                    statuses.forEach(function(status, index) {
                                        expect(annotations[index]._voiceBox.paused).toBe(status);
                                    });
                                }

                                function assertPlayCount(counts) {
                                    counts.forEach(function(count, index) {
                                        expect(annotations[index]._voiceBox.play.callCount).toBe(count);
                                    });
                                }

                                tick(0);
                                assertPaused([true, true, true]);
                                assertPlayCount([0, 0, 0]);

                                tick(4);
                                assertPaused([true, true, true]);
                                assertPlayCount([0, 0, 0]);

                                tick(5);
                                assertPaused([false, true, true]);
                                assertPlayCount([1, 0, 0]);

                                tick(10);
                                assertPaused([false, true, true]);
                                assertPlayCount([1, 0, 0]);

                                tick(14);
                                assertPaused([true, true, true]);
                                assertPlayCount([1, 0, 0]);

                                tick(15.5);
                                assertPaused([true, false, true]);
                                assertPlayCount([1, 1, 0]);

                                tick(35);
                                assertPaused([true, true, true]);
                                assertPlayCount([1, 1, 0]);

                                tick(40);
                                assertPaused([true, true, false]);
                                assertPlayCount([1, 1, 1]);

                                tick(10);
                                assertPaused([false, true, true]);
                                assertPlayCount([2, 1, 1]);
                            });
                        });
                    });
                });
            });
        });
    });
}());
