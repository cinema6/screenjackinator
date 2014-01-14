(function() {
    'use strict';

    define(['app'], function() {
        describe('<div c6-vertical-center="top">Foo</div>', function() {
            var $rootScope,
                $scope,
                $compile,
                $window,
                window$;

            var testBox$;

            beforeEach(function() {
                testBox$ = $('<div style="width: 800px; height: 600px; position: relative;">');
                $('body').append(testBox$);

                module('c6.screenjackinator');

                inject(function($injector) {
                    $compile = $injector.get('$compile');
                    $rootScope = $injector.get('$rootScope');
                    $window = $injector.get('$window');

                    window$ = angular.element($window);
                    $scope = $rootScope.$new();
                });
            });

            afterEach(function() {
                testBox$.remove();
            });

            it('should center itself in the parent using margin-top as the default', function() {
                var centered$ = $('<div c6-vertical-center style="height: 10%;">Foo</div>').appendTo(testBox$);
                $scope.$apply(function() {
                    $compile(centered$)($scope);
                });

                expect(centered$.css('margin-top')).toBe('270px');
            });

            it('should center itself with the provided prop', function() {
                var centered$ = $('<div c6-vertical-center="top" style="height: 20%; position: absolute;">Hey</div>').appendTo(testBox$);
                $scope.$apply(function() {
                    $compile(centered$)($scope);
                });

                expect(centered$.css('top')).toBe('240px');
            });

            it('should recompute the centering when the c6VerticalCenter:recalculate event is $broadcasted or $emitted', function() {
                var container$ = $('<div style="height: 80%; width: 100%; position: relative;"></div>').appendTo(testBox$),
                    centered$ = $('<div c6-vertical-center></div>').appendTo(container$),
                    sizer$ = $('<div style="height: 50px;">Foo</div>').appendTo(centered$);
                $scope.$apply(function() {
                    $compile(centered$)($scope);
                });

                expect(centered$.css('margin-top')).toBe('215px');

                sizer$.height(100);
                expect(centered$.css('margin-top')).toBe('215px');

                $rootScope.$broadcast('c6VerticalCenter:recalculate');
                expect(centered$.css('margin-top')).toBe('190px');
            });

            describe('attributes', function() {
                describe('resize', function() {
                    var centered$;

                    describe('if present', function() {
                        beforeEach(function() {
                            centered$ = $('<div c6-vertical-center resize style="height: 30%;">Foo</div>').appendTo(testBox$);
                            $scope.$apply(function() {
                                $compile(centered$)($scope);
                            });
                        });

                        it('should recalculate sizing when the window resizes', function() {
                            expect(centered$.css('margin-top')).toBe('210px');

                            testBox$.height(400);

                            expect(centered$.css('margin-top')).toBe('210px');

                            window$.trigger('resize');

                            expect(centered$.css('margin-top')).toBe('140px');
                        });

                        it('should clean up after itself', function() {
                            expect(centered$.css('margin-top')).toBe('210px');

                            $scope.$destroy();
                            testBox$.height(400);
                            window$.trigger('resize');

                            expect(centered$.css('margin-top')).toBe('210px');
                        });
                    });

                    describe('if not present', function() {
                        beforeEach(function() {
                            centered$ = $('<div c6-vertical-center style="height: 30%;">Foo</div>').appendTo(testBox$);
                            $scope.$apply(function() {
                                $compile(centered$)($scope);
                            });
                        });

                        it('should recalculate sizing when the window resizes', function() {
                            expect(centered$.css('margin-top')).toBe('210px');

                            testBox$.height(400);
                            window$.trigger('resize');

                            expect(centered$.css('margin-top')).toBe('210px');
                        });
                    });
                });
            });
        });
    });
}());
