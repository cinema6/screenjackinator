(function() {
    'use strict';

    angular.module('c6.screenjackinator')
        .controller('C6ScreenjackPlayerController', ['$scope', 'VideoService', 'VoiceTrackService', 'c6Computed',
        function                                    ( $scope ,  VideoService ,  VoiceTrackService ,  c6Computed ) {
            var video,
                controlsController = {},
                controlsDelegate = {
                    nodeClicked: function(node) {
                        this.jumpTo(node.annotation);
                    }.bind(this)
                },
                c = c6Computed($scope);

            this.controlsNodes = [];

            function playVoices() {
                VoiceTrackService.play();
            }

            function pauseVoices() {
                VoiceTrackService.pause();
            }

            function tickVoices(event, video) {
                VoiceTrackService.tick(video.player.currentTime);
                updateTimestamp(video.player.currentTime, video.player.duration);
            }

            function updateTimestamp(time, duration) {
                var currTime = convertTimestamp(parseInt(time, 10)),
                    remainTime = convertTimestamp(parseInt(duration - time, 10));

                if($scope.videoTime !== currTime) {
                    $scope.videoTime = currTime;
                }
                if($scope.videoRemainingTime !== remainTime) {
                    $scope.videoRemainingTime = remainTime;
                }
            }

            // TODO: move into a filter
            function convertTimestamp(timestamp) {
                var minutes, seconds,
                    pad = function(digit) {
                        return digit < 10 ? '0' + digit : '' + digit;
                    };

                minutes = parseInt(timestamp / 60, 10);
                seconds = timestamp - (60 * minutes);

                return pad(minutes) + ':' + pad(seconds);
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

            function isFetching() {
                return $scope.annotations && $scope.annotations.map(function(val) {return val._fetching;}).indexOf(true) > -1;
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
                updateTimestamp(video.player.currentTime, video.player.duration);

                c(this, 'controlsNodes', function() {
                    var nodes = [];

                    if (!$scope.annotations || !video) {
                        return nodes;
                    }

                    angular.forEach($scope.annotations, function(annotation, index) {
                        nodes.push({
                            style: 'scene',
                            position: (annotation.timestamp / video.player.duration) * 100,
                            text: (index + 1).toString(),
                            annotation: annotation
                        });
                    });

                    return nodes;
                }, ['annotations']);

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

            $scope.$on('c6Line:next', function(event, annotation) {
                if($scope.annotations[annotation.id+1]) {
                    this.jumpTo($scope.annotations[annotation.id+1]);
                }
            }.bind(this));

            $scope.$on('c6Line:prev', function(event, annotation) {
                if($scope.annotations[annotation.id-1]) {
                    this.jumpTo($scope.annotations[annotation.id-1]);
                }
            }.bind(this));

            $scope.$on('c6Line:stopListening', function(event, annotation) {
                VoiceTrackService.tick(annotation.timestamp);
                pauseVoices();
            }.bind(this));

            this.controlsController = controlsController;
            this.controlsDelegate = controlsDelegate;

            c(this, 'bubbles', function() {
                return ($scope.annotations || []).filter(function(annotation) {
                    return annotation.type === 'popup';
                });
            }, ['annotations']);

            c(this, 'lines', function() {
                return ($scope.annotations || []).filter(function(annotation) {
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

            $scope.$watch(isFetching, function(newVal) {
                var cb = newVal ? VideoService.disablePlay : VideoService.enablePlay;
                cb();
            });

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

        .directive('c6Line', ['c6UrlMaker', 'c6Computed', '$document',
        function             ( c6UrlMaker, c6computed, $document ) {
            return {
                restrict: 'E',
                templateUrl: c6UrlMaker('views/directives/c6_line.html'),
                scope: {
                    editable: '=',
                    show: '=',
                    annotation: '=',
                    disableprev: '=',
                    disablenext: '='
                },
                link: function(scope, element) {
                    var preEditText = null,
                        c = c6computed(scope);

                    scope.fetching = false;
                    scope.invalid = false;
                    scope.listening = false;
                    scope.audioTimeRemaining = '00:00';
                    scope.errorMessage = '';

                    c(scope, 'errorMessage', function() {
                        var remaining;
                        if(scope && scope.annotation && scope.invalid) {
                            return 'Dialogue too long! Max time is ' + scope.annotation.duration + ' seconds';
                        }
                        if(scope && scope.annotation && ('text' in scope.annotation) ) {
                            remaining = scope.annotation.maxChars - scope.annotation.text.length;
                            return remaining === 0 ? ('No more space! Max characters: ' + scope.annotation.maxChars) : remaining + ' Characters Remaining';
                        }
                    }, ['annotation.text', 'invalid']);

                    c(scope, 'isSavable', function() {
                        return scope && scope.annotation && ('text' in scope.annotation) && (scope.annotation.text.length !== 0) && scope.annotation.isValid();
                    }, ['annotation.text', 'annotation.isValid()']);

                    c(scope, 'isListenable', function() {
                        return scope && scope.annotation && ('text' in scope.annotation) && scope.annotation.text.length !== 0 && !scope.fetching;
                    }, ['annotation.text', 'fetching']);

                    c(scope, 'isEmpty', function() {
                        return scope && scope.annotation && ('text' in scope.annotation) && scope.annotation.text.length === 0;
                    }, ['annotation.text']);

                    // TODO: move into a filter
                    function convertTimestamp(timestamp) {
                        var minutes, seconds,
                            pad = function(digit) {
                                return digit < 10 ? '0' + digit : '' + digit;
                            };

                        minutes = parseInt(timestamp / 60, 10);
                        seconds = timestamp - (60 * minutes);

                        return pad(minutes) + ':' + pad(seconds);
                    }

                    function setAudioTimer() {
                        scope.$apply(function() {
                            scope.audioTimeRemaining = convertTimestamp(parseInt(scope.annotation._voiceBox.currentTime, 10));
                        });
                    }

                    function outsideElementClick(event) {
                        var isChild = element.has(event.target).length > 0;
                        var isSelf = element[0] === event.target;
                        var isInside = isChild || isSelf;
                        if(!isInside) {
                            scope.discardChanges();
                            scope.$digest();
                        }
                    }

                    scope.next = function() {
                        scope.$emit('c6Line:next', scope.annotation);
                    };

                    scope.prev = function() {
                        scope.$emit('c6Line:prev', scope.annotation);
                    };

                    scope.listen = function() {
                        if(scope.fetching) { return; }

                        if(!scope.listening) {
                            scope.fetching = true;
                            scope.annotation.getMP3().then(function() {
                                scope.fetching = false;
                                scope.invalid = !scope.annotation.isValid();
                                scope.annotation._voiceBox.addEventListener('timeupdate', setAudioTimer);
                                if(!scope.invalid) {
                                    scope.listening = true;
                                    scope.annotation.speak().then(function() {
                                        scope.listening = false;
                                    });
                                }
                            });
                        } else {
                            scope.listening = false;
                            scope.annotation._voiceBox.removeEventListener('timeupdate', setAudioTimer);
                            scope.$emit('c6Line:stopListening', scope.annotation);
                        }
                    };

                    scope.discardChanges = function() {
                        scope.annotation.text = preEditText;
                        scope.invalid = false;
                        scope.editing = false;
                    };

                    scope.saveChanges = function() {
                        scope.annotation.getMP3()
                            .then(function() {
                                var _invalid = !scope.annotation.isValid();
                                scope.invalid = _invalid;
                                scope.editing = _invalid;
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

                        if(editing && !wasEditing) {
                            $document.bind('click', outsideElementClick);
                        }

                        if(wasEditing && !editing) {
                            if(!scope.annotation.isVirgin()) {
                                element.addClass('modified-class');
                            }
                            $document.unbind('click', outsideElementClick);
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
                    scope.invalid = false;

                    scope.saveChanges = function() {
                        var _invalid = !scope.annotation.isValid();
                        scope.invalid = _invalid;
                        scope.editing = _invalid;
                    };

                    scope.discardChanges = function() {
                        scope.annotation.text = preEditText;
                        scope.invalid = false;
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
                            scope.modified = !scope.annotation.isVirgin();
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
