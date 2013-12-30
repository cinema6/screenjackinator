(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('PlayerController', ['$scope', 'VideoService', 'fail',
        function                        ( $scope ,  VideoService ,  fail ) {
            var self = this;

            function resetVideo(event, video) {
                self.showEnd = false;
                video.off('timeupdate', resetVideo);
            }

            function handleVideoEnd(event, video) {
                self.showEnd = true;
                video.on('timeupdate', resetVideo);
            }

            function playVideo(video) {
                video.player.currentTime = 0;
                video.player.play();

                return video;
            }

            function attachVideoListeners(video) {
                return video.on('ended', handleVideoEnd);
            }

            $scope.$on('siteTransitionComplete', function() {
                VideoService.getVideo('video')
                    .then(playVideo)
                    .then(attachVideoListeners)
                    .then(null, fail);
            });

            this.showEnd = false;

            $scope.PlayerCtrl = this;
        }]);
}());
