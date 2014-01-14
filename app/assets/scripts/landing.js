(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('LandingController', ['$scope', '$stateParams',
        function                         ( $scope ,  $stateParams ) {
            this.getExperienceState = function() {
                if ($stateParams.playback === 'true') {
                    return 'player';
                }

                return 'experience';
            };

            $scope.LandingCtrl = this;
        }]);
}());
