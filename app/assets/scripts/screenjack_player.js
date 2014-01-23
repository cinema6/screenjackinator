(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('C6ScreenjackPlayerController', ['$scope', 'VideoService', 'VoiceTrackService', 'c6Computed',
        function                                    ( $scope ,  VideoService ,  VoiceTrackService ,  c          ) {
            var video,
                controlsController = {},
                controlsDelegate = {
                    nodeClicked: function(node) {
                        this.jumpTo(node.annotation);
                    }.bind(this)
                };

            function playVoices() {
                VoiceTrackService.play();
            }

            function pauseVoices() {
                VoiceTrackService.pause();
            }

            function tickVoices(event, video) {
                VoiceTrackService.tick(video.player.currentTime);
            }

            function syncVoiceTrackService(video) {
                video
                    .on('play', playVoices)
                    .on('pause', pauseVoices)
                    .on('ended', pauseVoices)
                    .on('timeupdate', tickVoices);
            }

            function annotationEmit(event) {
                var eventName = ('c6Annotation:' + (event.name.split(':')[1])),
                    args = Array.prototype.slice.call(arguments);

                args[0] = eventName;

                $scope.$emit.apply($scope, args);
            }

            VideoService.listenOn($scope);
            VideoService.bindTo(
                'video',
                controlsDelegate,
                controlsController,
                $scope,
                'Ctrl.controlsController.ready'
            );
            VideoService.getVideo('video').then(function(c6Video) {
                video = c6Video;

                this.controlsNodes.invalidate();
                syncVoiceTrackService(c6Video);
            }.bind(this));

            $scope.$on('c6Bubble:show', function(event, annotation) {
                if (!video || !annotation.sfx) { return; }

                if (!video.player.paused) {
                    annotation.sfx.play();
                }
            });

            $scope.$on('c6Bubble:show', annotationEmit);
            $scope.$on('c6Line:show', annotationEmit);
            $scope.$on('c6Bubble:hide', annotationEmit);
            $scope.$on('c6Line:hide', annotationEmit);
            $scope.$on('c6Bubble:editstart', annotationEmit);
            $scope.$on('c6Line:editstart', annotationEmit);
            $scope.$on('c6Bubble:editdone', annotationEmit);
            $scope.$on('c6Line:editdone', annotationEmit);

            $scope.$on('$destroy', function() {
                video
                    .off('play', playVoices)
                    .off('pause', pauseVoices)
                    .off('ended', pauseVoices)
                    .off('timeupdate', tickVoices);
            });

            this.controlsController = controlsController;
            this.controlsDelegate = controlsDelegate;
            this.controlsNodes = c($scope, function(annotations) {
                var nodes = [];

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

                return nodes;
            }, ['annotations']);

            this.bubbles = c($scope, function(annotations) {
                return (annotations || []).filter(function(annotation) {
                    return annotation.type === 'popup';
                });
            }, ['annotations']);

            this.lines = c($scope, function(annotations) {
                return (annotations || []).filter(function(annotation) {
                    return (annotation.type === 'tts');
                });
            }, ['annotations']);

            this.jumpTo = function(annotation) {
                if (!video) { return; }

                video.player.currentTime = annotation.timestamp;
            };

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

            $scope.Ctrl = this;
        }])

        .directive('c6ScreenjackPlayer', ['c6UrlMaker',
        function                         ( c6UrlMaker ) {
            return {
                restrict: 'E',
                templateUrl: c6UrlMaker('views/directives/c6_screenjack_player.html'),
                scope: {
                    annotations: '=',
                    src: '@'
                },
                controller: 'C6ScreenjackPlayerController',
                link: function(scope, element, attrs) {
                    scope.readOnly = angular.isDefined(attrs.readonly);
                }
            };
        }])

        .directive('c6Line', ['c6UrlMaker',
        function             ( c6UrlMaker ) {
            return {
                restrict: 'E',
                templateUrl: c6UrlMaker('views/directives/c6_line.html'),
                scope: {
                    editable: '=',
                    show: '=',
                    annotation: '='
                },
                link: function(scope, element) {
                    var preEditText = null;

                    //scope.modified = false;

                    scope.discardChanges = function() {
                        scope.annotation.text = preEditText;
                        scope.editing = false;
                    };

                    scope.saveChanges = function() {
                        scope.annotation.getMP3()
                            .then(function() {
                                scope.editing = false;
                            });
                    };

                    scope.enterEdit = function() {
                        scope.editing = true;
                    };

                    element.bind('click', function() {
                        if (!scope.editable) { return; }

                        scope.enterEdit();
                        scope.$digest();
                    });

                    scope.$watch('show', function(show) {
                        var display = show ? '' : 'none',
                            event = 'c6Line:' + (show ? 'show' : 'hide');

                        element.css('display', display);
                        scope.$emit(event, scope.annotation, element[0].getBoundingClientRect());
                    });

                    scope.$watch('editing', function(editing, wasEditing) {
                        var text = scope.annotation && scope.annotation.text,
                            eventName = 'c6Line:' + (editing ? 'editstart' : 'editdone');

                        preEditText = editing ? text : null;

                        if(wasEditing && !editing) {
                            if(!scope.annotation.isVirgin()) {
                                element.addClass('modified-class');
                            }
                        }

                        if (editing !== wasEditing) {
                            scope.$emit(eventName, scope.annotation);
                        }
                    });
                }
            };
        }])

        .directive('c6Bubble', ['c6UrlMaker',
        function               ( c6UrlMaker ) {
            return {
                restrict: 'E',
                templateUrl: c6UrlMaker('views/directives/c6_bubble.html'),
                scope: {
                    show: '=',
                    annotation: '=',
                    editable: '='
                },
                link: function(scope, element) {
                    var preEditText = null;

                    scope.modified = false;

                    scope.discardChanges = function() {
                        scope.annotation.text = preEditText;
                        scope.editing = false;
                    };

                    scope.enterEdit = function() {
                        scope.editing = true;
                    };

                    element.addClass('annotation__group');

                    element.bind('click', function() {
                        if (!scope.editable) { return; }

                        scope.enterEdit();
                        scope.$digest();
                    });

                    scope.$watch('editing', function(editing, wasEditing) {
                        var text = scope.annotation && scope.annotation.text,
                            eventName = 'c6Bubble:' + (editing ? 'editstart' : 'editdone');

                        preEditText = editing ? text : null;

                        if(wasEditing && !editing) {
                            scope.modified = scope.annotation.isVirgin() ? false : true;
                        }

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
