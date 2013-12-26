(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('ExperienceController', ['$scope', 'VideoService', 'c6Computed',
        function                            ( $scope ,  VideoService ,  c          ) {
            var self = this;

            function handleVideoEvents(video) {
                video.on('timeupdate', angular.noop);
            }

            function publishVideo(video) {
                self.video = video;
                return video;
            }

            VideoService.getVideo('video')
                .then(publishVideo)
                .then(handleVideoEvents);

            this.annotations = c($scope, function(annotations) {
                return annotations || null;
            }, ['AppCtrl.project.annotations']);

            this.bubbles = c($scope, function(annotations) {
                return (annotations || []).filter(function(annotation) {
                    return annotation.type === 'popup';
                });
            }, ['ExperienceCtrl.annotations()']);

            this.jumpTo = function(annotation) {
                var video = self.video;

                if (!video) { return; }

                video.player.currentTime = annotation.timestamp;
            };

            $scope.ExperienceCtrl = this;
        }]);
}());
