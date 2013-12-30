(function() {
    'use strict';

    define(['screenjack_player'], function() {
        describe('<c6-screenjack-player></c6-screenjack-player>', function() {
            var $rootScope,
                $scope,
                $compile;

            beforeEach(function() {
                module('c6.screenjackinator');

                inject(function($injector) {
                    $rootScope = $injector.get('$rootScope');
                    $compile = $injector.get('$compile');

                    $scope = $rootScope.$new();
                });
            });

            describe('attributes', function() {
                describe('readonly', function() {
                    var player,
                        scope;

                    describe('if present', function() {
                        beforeEach(function() {
                            $scope.$apply(function() {
                                player = $compile('<c6-screenjack-player readonly></c6-screenjack-player>')($scope);
                            });
                            scope = player.scope();
                        });

                        it('should set the scope\'s readOnly property to true', function() {
                            expect(scope.readOnly).toBe(true);
                        });
                    });

                    describe('if not present', function() {
                        beforeEach(function() {
                            $scope.$apply(function() {
                                player = $compile('<c6-screenjack-player></c6-screenjack-player>')($scope);
                            });
                            scope = player.scope();
                        });

                        it('should set the scope\'s readOnly property to false', function() {
                            expect(scope.readOnly).toBe(false);
                        });
                    });
                });
            });
        });
    });
}());
