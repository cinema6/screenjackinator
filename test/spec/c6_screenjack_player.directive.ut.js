(function() {
    'use strict';

    define(['screenjack_player'], function() {
        describe('<c6-screenjack-player></c6-screenjack-player>', function() {
            var $rootScope,
                $scope,
                $compile;

            var c6VideoService;

            beforeEach(function() {
                c6VideoService = {
                    bestFormat: function() {
                        return 'video/mp4';
                    }
                };

                module('c6.ui', function($provide) {
                    $provide.value('c6VideoService', c6VideoService);
                    $provide.value('c6VideoDirective', {});
                });

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

                            scope = player.children().scope();
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
                            scope = player.children().scope();
                        });

                        it('should set the scope\'s readOnly property to false', function() {
                            expect(scope.readOnly).toBe(false);
                        });
                    });
                });

                describe('src', function() {
                    var player;

                    beforeEach(function() {
                        $scope.foo = 'myvideo.mp4';

                        $scope.$apply(function() {
                            player = $compile('<c6-screenjack-player src="{{foo}}"></c6-screenjack-player>')($scope);
                        });
                    });

                    it('should pass on the value to the video', function() {
                        var video = player.find('video');

                        expect(video.attr('c6-src')).toBe('src');
                    });
                });
            });
        });
    });
}());
