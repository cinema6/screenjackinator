(function() {
    'use strict';

    define(['wizard'], function() {
        describe('WizardController', function() {
            var $rootScope,
                $scope,
                $controller,
                WizardCtrl;

            var ExperienceCtrl;

            beforeEach(function() {
                module('c6.screenjackinator');

                inject(function($injector) {
                    $rootScope = $injector.get('$rootScope');
                    $controller = $injector.get('$controller');

                    $scope = $rootScope.$new();
                    WizardCtrl = $controller('WizardController', { $scope: $scope });
                });

                ExperienceCtrl = $scope.ExperienceCtrl = {
                    video: {
                        player: {
                            pause: jasmine.createSpy('player.pause()')
                        }
                    }
                };
            });

            it('should exist', function() {
                expect(WizardCtrl).toBeDefined();
            });

            it('should put itself on the $scope', function() {
                expect($scope.WizardCtrl).toBe(WizardCtrl);
            });

            describe('when c6Bubble:show is $emitted', function() {
                beforeEach(function() {
                    $scope.$emit('c6Bubble:show', {}, { top: 54, left: 200 });
                });

                it('should pause the video', function() {
                    expect(ExperienceCtrl.video.player.pause).toHaveBeenCalled();
                });

                it('should setup and show the annotationTip to the left of the annotation', function() {
                    expect(WizardCtrl.annotationTip.show).toBe(true);
                    expect(WizardCtrl.annotationTip.position.top).toBe(54);
                    expect(WizardCtrl.annotationTip.position.right).toBe(200);
                });
            });

            describe('properties', function() {
                describe('annotationTip', function() {
                    describe('show', function() {
                        it('should be false', function() {
                            expect(WizardCtrl.annotationTip.show).toBe(false);
                        });
                    });

                    describe('position', function() {
                        describe('top', function() {
                            it('should be 0', function() {
                                expect(WizardCtrl.annotationTip.position.top).toBe(0);
                            });
                        });

                        describe('right', function() {
                            it('should be 0', function() {
                                expect(WizardCtrl.annotationTip.position.right).toBe(0);
                            });
                        });
                    });
                });
            });
        });
    });
}());
