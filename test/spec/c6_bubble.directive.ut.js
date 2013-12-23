(function() {
    'use strict';

    define(['video'], function() {
        describe('<c6-bubble>Foo</c6-bubble>', function() {
            var $compile,
                $rootScope,
                $scope;

            beforeEach(function() {
                module('c6.screenjackinator');

                inject(function($injector) {
                    $compile = $injector.get('$compile');
                    $rootScope = $injector.get('$rootScope');

                    $scope = $rootScope.$new();
                });
            });

            it('should transclude its contents', function() {
                var bubble;

                $scope.foo = 'Hey!';
                $scope.$apply(function() {
                    bubble = $compile('<c6-bubble>{{foo}}</c6-bubble>')($scope);
                });

                expect(bubble.find('.annotations__txt span').text()).toBe('Hey!');
            });

            describe('attributes', function() {
                describe('show', function() {
                    var bubble;

                    beforeEach(function() {
                        $scope.showBubble = true;

                        bubble = $compile('<c6-bubble show="showBubble">Foo</c6-bubble>')($scope);
                    });

                    it('should be shown when true', function() {
                        expect(bubble.css('display')).toBe('');
                    });

                    it('should be hidden when false', function() {
                        $scope.$apply(function() {
                            $scope.showBubble = false;
                        });

                        expect(bubble.css('display')).toBe('none');
                    });
                });
            });
        });
    });
}());
