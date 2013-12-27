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

            this.skipWizard = function() {
                this.showWelcome = false;
            };

            this.startWizard = function() {
                this.showWelcome = false;
                this.showWizard = true;

                this.video.player.currentTime = 0;
                this.video.player.play();
            };

            $scope.$on('c6Bubble:show', function(event, annotation, boundingBox) {
                if (event.targetScope === event.currentScope) { return; }

                $scope.$broadcast('c6Bubble:show', annotation, boundingBox);
            });

            $scope.$on('c6Bubble:editdone', function() {
                this.showWizard = false;
            }.bind(this));

            $scope.ExperienceCtrl = this;
        }]);
}());
