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

            this.showWelcome = true;
            this.showWizard = false;

            this.annotations = c($scope, function(annotations) {
                return annotations || null;
            }, ['AppCtrl.project.annotations']);

            this.preview = function(annotation) {
                var video = this.video;

                function stopOnTime(event) {
                    var player = event.target,
                        targetEnd = (annotation.timestamp + annotation.duration + 1);

                    if (player.currentTime >= targetEnd) {
                        player.pause();
                        video.off('timeupdate', stopOnTime);
                    }
                }

                video.player.currentTime = Math.max((annotation.timestamp - 2), 0);
                video.player.play();
                video.on('timeupdate', stopOnTime);
            };

            this.jumpTo = function(annotation) {
                var video = self.video;

                if (!video) { return; }

                video.player.currentTime = annotation.timestamp;
            };

            this.skipWizard = function() {
                this.showWelcome = false;
            };

            this.startWizard = function() {
                var player = this.video.player;

                this.showWelcome = false;
                this.showWizard = true;

                player.currentTime = 0;
                player.play();
            };

            this.endWizard = function() {
                this.showWizard = false;
                this.video.player.play();
            };

            $scope.$on('c6Bubble:show', function(event, annotation, boundingBox) {
                if (event.targetScope === event.currentScope) { return; }

                $scope.$broadcast('c6Bubble:show', annotation, boundingBox);
            });

            $scope.$on('c6Bubble:editstart', function() {
                this.video.player.pause();
            }.bind(this));

            $scope.$on('c6Bubble:editdone', function() {
                if (this.showWizard) {
                    this.endWizard();
                }
            }.bind(this));

            $scope.ExperienceCtrl = this;
        }]);
}());
