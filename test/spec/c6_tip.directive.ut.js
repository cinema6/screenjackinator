(function() {
    'use strict';

    define(['wizard'], function() {
        describe('<c6-tip>Foo</c6-tip>', function() {
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
                var tip;

                describe('position', function() {
                    beforeEach(function() {
                        $scope.position = {
                            top: 0,
                            left: 0
                        };

                        $scope.$apply(function() {
                            tip = $compile('<c6-tip position="position"></c6-tip>')($scope);
                        });
                    });

                    it('should bind its position to the provided position object', function() {
                        expect(tip.css('top')).toBe('0px');
                        expect(tip.css('left')).toBe('0px');

                        $scope.$apply(function() {
                            $scope.position.top = 33;
                            $scope.position.left = 66;
                        });

                        expect(tip.css('top')).toBe('33px');
                        expect(tip.css('left')).toBe('66px');

                        $scope.$apply(function() {
                            $scope.position.top = 187;
                            $scope.position.left = 46;
                        });

                        expect(tip.css('top')).toBe('187px');
                        expect(tip.css('left')).toBe('46px');
                    });
                });

                describe('show', function() {
                    var tip;

                    beforeEach(function() {
                        $scope.show = true;

                        $scope.$apply(function() {
                            tip = $compile('<c6-tip show="show"></c6-tip>')($scope);
                        });
                    });

                    it('should be shown when show is true', function() {
                        expect(tip.css('display')).toBe('');
                    });

                    it('should be hidden when show is false', function() {
                        $scope.$apply(function() {
                            $scope.show = false;
                        });

                        expect(tip.css('display')).toBe('none');
                    });
                });
            });
        });
    });
}());
