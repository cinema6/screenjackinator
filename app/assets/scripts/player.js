(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('PlayerController', ['$scope', 'VideoService', 'fail',
        function                        ( $scope ,  VideoService ,  fail ) {
            var self = this,
                video = null;

            function resetVideo(event, c6Video) {
                self.showEnd = false;
                c6Video.off('timeupdate', resetVideo);
            }

            function handleVideoEnd(event, c6Video) {
                self.showEnd = true;
                c6Video.on('timeupdate', resetVideo);
            }

            function saveVideo(c6Video) {
                video = c6Video;
                return c6Video;
            }

            function waitForTransition() {
                $scope.$on('siteTransitionComplete', function() {
                    self.replay();
                });
            }

            function attachVideoListeners(c6Video) {
                return c6Video.on('ended', handleVideoEnd);
            }

            VideoService.getVideo('video')
                .then(saveVideo)
                .then(attachVideoListeners)
                .then(waitForTransition)
                .then(null, fail);

            this.showEnd = false;

            this.replay = function() {
                video.player.currentTime = 0;
                video.player.play();
            };

            $scope.PlayerCtrl = this;
        }]);
}());
