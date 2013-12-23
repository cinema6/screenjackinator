(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('VideoController', ['$scope', 'c6Computed', 'VideoService',
        function                       ( $scope ,  c          ,  VideoService ) {
            var video;

            function saveVideo(c6Video) {
                video = c6Video;

                return video;
            }

            function handleVideoEvents(c6Video) {
                // Trigger a $digest on timeupdate
                c6Video.on('timeupdate', angular.noop);
            }

            VideoService.getVideo('video')
                .then(saveVideo)
                .then(handleVideoEvents);

            this.annotations = c($scope, function(annotations) {
                return annotations || null;
            }, ['AppCtrl.project.annotations']);

            this.bubbles = c($scope, function(annotations) {
                return (annotations || []).filter(function(annotation) {
                    return annotation.type === 'popup';
                });
            }, ['VideoCtrl.annotations()']);

            this.annotationIsActive = function(annotation) {
                var start = annotation.timestamp,
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
                transclude: true,
                templateUrl: c6UrlMaker('views/directives/c6_bubble.html'),
                scope: {
                    show: '='
                },
                link: function(scope, element) {
                    scope.$watch('show', function(show) {
                        var display = show ? '' : 'none';

                        element.css('display', display);
                    });
                }
            };
        }]);
}());
