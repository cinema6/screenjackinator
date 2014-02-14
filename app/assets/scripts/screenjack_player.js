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

            function convertTimestamp(timestamp) {
                function pad(digit) {
                    return digit < 10 ? '0' + digit : '' + digit;
                }
                var minutes, seconds;
                minutes = parseInt(timestamp / 60, 10);
                seconds = timestamp - (60*minutes);

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

            $scope.$on('next', function(event, annotation) {
                if($scope.annotations[annotation.id+1]) {
                    this.jumpTo($scope.annotations[annotation.id+1]);
                }
            }.bind(this));

            $scope.$on('prev', function(event, annotation) {
                if($scope.annotations[annotation.id-1]) {
                    this.jumpTo($scope.annotations[annotation.id-1]);
                }
            }.bind(this));

            $scope.$on('stopListening', function(event, annotation) {
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

            // this.disablePrev = function(annotation) {
            //     return (annotation.id === 0);
            // };

            // this.disableNext = function(annotation) {
            //     return (annotation.id === $scope.annotations.length - 1);
            // };

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

        .directive('c6Line', ['c6UrlMaker', 'c6Computed',
        function             ( c6UrlMaker, c6computed ) {
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

                    scope.listenIsPlaying = false;
                    scope.listening = false;

                    c(scope, 'isListenable', function() {
                        return scope && scope.annotation && scope.annotation.text && scope.annotation.text.length !== 0 && !scope.fetching;
                    }, ['annotation.text']);

                    c(scope, 'isEmpty', function() {
                        return scope && scope.annotation && scope.annotation.text && scope.annotation.text.length === 0;
                    }, ['annotation.text']);

                    function convertTimestamp(timestamp) {
                        function pad(digit) {
                            return digit < 10 ? '0' + digit : '' + digit;
                        }
                        var minutes, seconds;
                        minutes = parseInt(timestamp / 60, 10);
                        seconds = timestamp - (60*minutes);

                        return pad(minutes) + ':' + pad(seconds);

                    }

                    scope.next = function() {
                        scope.$emit('next', scope.annotation);
                    };

                    scope.prev = function() {
                        scope.$emit('prev', scope.annotation);
                    };

                    scope.listen = function() {
                        if(!scope.listening) {
                            scope.listening = true;
                        } else {
                            scope.listening = false;
                        }
                    };

                    c(scope, 'audioTimeRemaining', function() {
                        window.console.log(scope.annotation._voiceBox.currentTime);
                        return scope && scope.annotation && scope.annotation._voiceBox && scope.annotation._voiceBox.currentTime;
                    }, ['annotation._voiceBox.currentTime']);

                    scope.$watch('listening', function(listening, wasListening) {
                        if(listening && !wasListening) {
                            scope.fetching = true;


                            scope.annotation.getMP3().then(function() {

                                // function scopepreserver(event, newAnnotation) {
                                //     return function () {
                                //         //do something with audio
                                //         window.console.log(arguments);
                                //         scope.audioTimeRemaining = convertTimestamp(parseInt(newAnnotation._voiceBox.duration - newAnnotation._voiceBox.currentTime, 10));
                                //     };
                                // }
                                // function myfunction() {
                                //     newAnnotation._voiceBox.ontimeupdate = scopepreserver(event, newAnnotation);
                                // }
                                // myfunction();




                                // function myfunction() {
                                //     // var paras = document.getElementsByTagName('p');
                                //     // var spans = document.getElementsByTagName('span');
                                //     // var newAnno = newAnnotation;
                                //     // var anotherAnno = newAnnotation;

                                //     newAnnotation._voiceBox.ontimeupdate = (function (a) {
                                //         return function () {
                                //             //do something with a and b
                                            
                                //             scope.audioTimeRemaining = a._voiceBox.currentTime;
                                //             window.console.log(scope.audioTimeRemaining);
                                //             // window.console.log(scope.annotation); // add .audioTimeRemaining here!
                                //             // window.console.log(a._voiceBox.currentTime);
                                //             // window.console.log('a', a._voiceBox.duration);
                                //         };
                                //     })(newAnnotation);
                                    
                                // }
                                // myfunction();

                                scope.fetching = false;
                                scope.listening = true;
                                scope.invalid = !scope.annotation.isValid();

                                if(!scope.invalid) {
                                    scope.listenIsPlaying = true;
                                    scope.annotation.speak().then(function() {
                                        scope.listenIsPlaying = false;
                                        scope.listening = false;
                                    });
                                }
                            });
                        }

                        if(!listening && wasListening) {
                            scope.listenIsPlaying = false;
                            scope.$emit('stopListening', scope.annotation);
                        }
                    });

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
