(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('VideoController', ['$scope',
        function                       ( $scope ) {
            this.annotationIsActive = function(annotation) {
                var video = $scope.ExperienceCtrl.video,
                    start = annotation.timestamp,
                    end = annotation.timestamp + annotation.duration,
                    currentTime;

                if (!video) {
                    return false;
                }

                currentTime = video.player.currentTime;

                return ((currentTime >= start) && (currentTime <= end));
            };

            $scope.VideoCtrl = this;
        }])

        .directive('c6Bubble', ['c6UrlMaker',
        function               ( c6UrlMaker ) {
            return {
                restrict: 'E',
                templateUrl: c6UrlMaker('views/directives/c6_bubble.html'),
                scope: {
                    show: '=',
                    annotation: '='
                },
                link: function(scope, element) {
                    var preEditText = null;

                    scope.discardChanges = function() {
                        scope.annotation.text = preEditText;
                        scope.editing = false;
                    };

                    element.addClass('annotation__group');

                    element.bind('click', function() {
                        scope.editing = true;
                        scope.$digest();
                    });

                    scope.$watch('editing', function(editing) {
                        var text = scope.annotation && scope.annotation.text;

                        preEditText = editing ? text : null;
                    });

                    scope.$watch('show', function(show) {
                        var display = show ? '' : 'none';

                        element.css('display', display);
                    });

                    scope.$watch('annotation.style.modifier', function(modifier, oldModifier) {
                        element.removeClass('annotation__group--' + oldModifier);

                        if (modifier) {
                            element.addClass('annotation__group--' + modifier);
                        }
                    });

                    scope.$watch('annotation.position', function(position) {
                        if (!position) { return; }

                        element.css(position);
                    }, true);
                }
            };
        }]);
}());
