(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('WizardController', ['$scope',
        function                        ( $scope ) {
            this.annotationTip = {
                show: false,
                position: {
                    top: 0,
                    right: 0
                }
            };

            $scope.$on('c6Annotation:show', function(event, annotation, position) {
                var tipPosition = this.annotationTip.position;

                $scope.ExperienceCtrl.video.player.pause();

                tipPosition.top = position.top;
                tipPosition.right = position.left;

                this.annotationTip.show = true;
            }.bind(this));

            $scope.WizardCtrl = this;
        }])

        .directive('c6Tip', [function() {
            return {
                restrict: 'E',
                scope: {
                    show: '=',
                    position: '='
                },
                link: function(scope, element) {
                    scope.$watch('show', function(show) {
                        var display = (show ? '' : 'none');

                        element.css('display', display);
                    });

                    scope.$watch('position', function(position) {
                        angular.forEach(position, function(value, prop) {
                            element.css(prop, (value + 'px'));
                        });
                    }, true);
                }
            };
        }]);
}());
