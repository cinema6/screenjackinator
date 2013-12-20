(function() {
    'use strict';

    define(['app'], function() {
        describe('<div c6-plane>', function() {
            var $compile,
                $rootScope,
                $timeout,
                $scope;

            var fail;

            beforeEach(function() {
                fail = jasmine.createSpy('fail(error)');

                module('c6.screenjackinator', function($provide) {
                    $provide.value('fail', fail);
                });

                inject(function($injector) {
                    $compile = $injector.get('$compile');
                    $rootScope = $injector.get('$rootScope');
                    $timeout = $injector.get('$timeout');
                    $scope = $rootScope.$new();
                });
            });

            describe('if there is no value provided', function() {
                beforeEach(function() {
                    $compile('<div c6-plane>Foo</div>')($scope);
                });

                it('should "fail"', function() {
                    expect(fail).toHaveBeenCalledWith('A plane was created with no name! Reality collapse imminent!');
                });
            });

            describe('if there is a value provided', function() {
                var plane;

                beforeEach(function() {
                    spyOn($rootScope, '$broadcast').andCallThrough();
                    spyOn($scope, '$on').andCallThrough();
                    spyOn($scope, '$emit').andCallThrough();

                    plane = $compile('<div c6-plane="foo" priority="2"><span>Hey</span><span>foo</span></div>')($scope);
                });

                it('should not "fail"', function() {
                    expect(fail).not.toHaveBeenCalled();
                });

                it('should $broadcast an event on the $rootScope to notify everybody it now exists', function() {
                    expect($rootScope.$broadcast).toHaveBeenCalled();

                    expect($rootScope.$broadcast.mostRecentCall.args[0]).toBe('c6Plane[foo]:appeared');
                    expect($rootScope.$broadcast.mostRecentCall.args[1][0]).toBe(plane[0]);
                    expect($rootScope.$broadcast.mostRecentCall.args[2]).toBe(2);
                });

                it('should listen for other planes with its name appearing', function() {
                    expect($scope.$on).toHaveBeenCalled();
                    expect($scope.$on.calls[0].args[0]).toBe('c6Plane[foo]:appeared');
                });

                it('should not do anything if it catches its own event', function() {
                    expect(plane[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');
                });

                it('should move its contents to a plane with a higher priority than it', function() {
                    var plane2,
                        childScope = $scope.$new();

                    expect(plane[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');

                    plane2 = $compile('<div c6-plane="foo" priority="1"></div>')(childScope);

                    expect(plane[0].innerHTML).toBe('');
                    expect(plane2[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');
                });

                it('should not move its contents to a plane with a lower priority than it', function() {
                    var plane2,
                        siblingScope = $rootScope.$new();

                    expect(plane[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');

                    plane2 = $compile('<div c6-plane="foo" priority="10"></div>')(siblingScope);

                    expect(plane[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');
                    expect(plane2[0].innerHTML).toBe('');
                });

                it('should always move its elements to the plane with the highest priority', function() {
                    var plane2,
                        plane3,
                        childScope = $scope.$new(),
                        grandchildScope = childScope.$new();

                    expect(plane[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');

                    plane2 = $compile('<div c6-plane="foo" priority="1"></div>')(childScope);
                    plane3 = $compile('<div c6-plane="foo" priority="0"></div>')(grandchildScope);

                    expect(plane[0].innerHTML).toBe('');
                    expect(plane2[0].innerHTML).toBe('');
                    expect(plane3[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');
                });

                it('should $emit an event when it\'s about to be destroyed', function() {
                    $scope.$destroy();

                    expect($scope.$emit).toHaveBeenCalled();
                    expect($scope.$emit.mostRecentCall.args[0]).toBe('c6Plane[foo]:destroying');
                    expect($scope.$emit.mostRecentCall.args[1][0]).toBe(plane[0]);
                    expect($scope.$emit.mostRecentCall.args[2]).toBe(2);
                });

                it('should listen for other planes with its name that are disappearing', function() {
                    expect($scope.$on).toHaveBeenCalled();
                    expect($scope.$on.mostRecentCall.args[0]).toBe('c6Plane[foo]:destroying');
                });

                it('should take the contents of a plane that is disappearing', function() {
                    var plane2 = $compile('<div c6-plane="foo" priority="20"></div>')($rootScope);

                    expect(plane[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');
                    expect(plane2[0].innerHTML).toBe('');

                    $scope.$destroy();

                    expect(plane2[0].innerHTML).toBe('<span>Hey</span><span>foo</span>');
                });

                it('should end up so the plane with highest priority get the contents', function() {
                    var plane2,
                        plane3,
                        plane4,
                        plane5,
                        childScope = $scope.$new(),
                        grandchildScope = childScope.$new(),
                        greatGrandchildScope = grandchildScope.$new();

                    plane = $compile('<div c6-plane="test" priority="15"></div>')($rootScope);
                    plane2 = $compile('<div c6-plane="test" priority="10"></div>')($scope);
                    plane3 = $compile('<div c6-plane="test" priority="5"></div>')(childScope);
                    plane4 = $compile('<div c6-plane="test" priority="20"></div>')(grandchildScope);
                    plane5 = $compile('<div c6-plane="test" priority="0">Foo</div>')(greatGrandchildScope);

                    expect(plane5[0].innerHTML).toBe('Foo');

                    greatGrandchildScope.$destroy();
                    $timeout.flush();

                    expect(plane3[0].innerHTML).toBe('Foo');
                });

                it('should give planes without priority the lowest priority', function() {
                    var plane2 = $compile('<div c6-plane="foo"></div>')($scope.$new());

                    expect(plane2[0].innerHTML).toBe('');
                });

                it('should work for text nodes', function() {
                    $compile('<div c6-plane="test" priority="2">Text Node</div>')($rootScope);
                    plane = $compile('<div c6-plane="test" priority="0"></div>')($scope);

                    expect(plane[0].innerHTML).toBe('Text Node');
                });
            });
        });
    });
}());
