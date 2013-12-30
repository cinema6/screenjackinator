(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('VideoController', ['$scope', 'VideoService', 'c6Computed',
        function                       ( $scope ,  VideoService ,  c          ) {
            var controlsController = {},
                controlsDelegate = {
                    nodeClicked: function(node) {
                        $scope.ExperienceCtrl.jumpTo(node.annotation);
                    }
                };

            VideoService.bindTo(
                'video',
                controlsDelegate,
                controlsController,
                $scope,
                'VideoCtrl.controlsController.ready'
            );

            $scope.$on('c6Bubble:show', function(event, annotation) {
                var video = $scope.ExperienceCtrl.video;

                if (!video || !annotation.sfx) { return; }

                if (!video.player.paused) {
                    annotation.sfx.play();
                }
            });

            this.controlsController = controlsController;
            this.controlsDelegate = controlsDelegate;
            this.controlsNodes = c($scope, function(annotations) {
                var video = $scope.ExperienceCtrl.video,
                    nodes = [];

                if (!annotations || !video) {
                    return nodes;
                }

                angular.forEach(annotations, function(annotation, index) {
                    nodes.push({
                        style: 'scene',
                        position: (annotation.timestamp / video.player.duration) * 100,
                        text: (index + 1).toString(),
                        annotation: annotation
                    });
                });

                return  nodes;
            }, ['ExperienceCtrl.annotations()']);

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

                    scope.$watch('editing', function(editing, wasEditing) {
                        var text = scope.annotation && scope.annotation.text,
                            eventName = 'c6Bubble:' + (editing ? 'editstart' : 'editdone');

                        preEditText = editing ? text : null;

                        if (editing !== wasEditing) {
                            scope.$emit(eventName, scope.annotation);
                        }
                    });

                    scope.$watch('show', function(show) {
                        var display = show ? '' : 'none',
                            event = 'c6Bubble:' + (show ? 'show' : 'hide');

                        element.css('display', display);
                        scope.$emit(event, scope.annotation, element[0].getBoundingClientRect());
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
