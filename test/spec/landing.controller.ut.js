(function() {
    'use strict';

    define(['landing'], function() {
        describe('LandingController', function() {
            var $rootScope,
                $scope,
                $controller,
                LandingCtrl;

            var $stateParams;

            beforeEach(function() {
                $stateParams = {
                    playback: null
                };

                module('ui.router', function($provide) {
                    $provide.value('$stateParams', $stateParams);
                });

                module('c6.screenjackinator');

                inject(function($injector) {
                    $rootScope = $injector.get('$rootScope');
                    $controller = $injector.get('$controller');

                    $scope = $rootScope.$new();
                    LandingCtrl = $controller('LandingController', { $scope: $scope });
                });
            });

            it('should exist', function() {
                expect(LandingCtrl).toBeDefined();
            });

            it('should put itself on the $scope', function() {
                expect($scope.LandingCtrl).toBe(LandingCtrl);
            });

            describe('methods', function() {
                describe('getExperienceState()', function() {
                    describe('if $stateParams.playback is not "true"', function() {
                        it('should be "experience"', function() {
                            expect(LandingCtrl.getExperienceState()).toBe('experience');
                        });
                    });

                    describe('if $stateParams.playback is "true"', function() {
                        beforeEach(function() {
                            $stateParams.playback = 'true';
                        });

                        it('should be "player"', function() {
                            expect(LandingCtrl.getExperienceState()).toBe('player');
                        });
                    });
                });
            });
        });
    });
}());
