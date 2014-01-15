(function(){
    'use strict';

    define(['app', 'templates'], function() {
        describe('AppController', function() {
            var $rootScope,
                $scope,
                $httpBackend,
                $q,
                $timeout,
                AppCtrl;

            var cinema6,
                c6ImagePreloader,
                gsap,
                fail,
                googleAnalytics,
                $stateProvider,
                $state,
                ProjectService,
                VideoService,
                VoiceTrackService,
                appData,
                cinema6Session,
                appConfig;

            beforeEach(function() {
                c6ImagePreloader = {
                    load: jasmine.createSpy('c6ImagePreloader.load()').andCallFake(function() {
                        return c6ImagePreloader._.loadResult;
                    }),
                    _: {
                        loadResult: {}
                    }
                };

                gsap = {
                    TweenLite: {
                        ticker: {
                            useRAF: jasmine.createSpy('gsap.TweenLite.ticker.useRAF()')
                        }
                    }
                };

                fail = jasmine.createSpy('fail(error)');

                googleAnalytics = jasmine.createSpy('googleAnalytics');

                ProjectService = {
                    new: jasmine.createSpy('ProjectService.new(appConfig, videoConfig)').andCallFake(function() {
                        return ProjectService._.newResult;
                    }),
                    _: {
                        newResult: {
                            annotations: [
                                {
                                    type: 'tts'
                                },
                                {
                                    type: 'popup'
                                },
                                {
                                    type: 'tts'
                                }
                            ]
                        }
                    }
                };

                VideoService = {
                    listenOn: jasmine.createSpy('VideoService.listenOn(scope)')
                };

                VoiceTrackService = {
                    init: jasmine.createSpy('VoiceTrackService.init()')
                };

                $stateProvider = {
                    state: jasmine.createSpy('$stateProvider.state()').andCallFake(function() {
                        return $stateProvider;
                    }),
                    $get: function() {
                        return $state;
                    }
                };

                $state = {
                    go: jasmine.createSpy('$state.go()')
                };

                appData = {
                    experience: {
                        img: {},
                        data: {}
                    },
                    profile: {
                        raf: {}
                    }
                };

                appConfig = {};

                module('ui.router', function($provide) {
                    $provide.provider('$state', $stateProvider);
                });

                module('c6.ui', function($provide) {
                    $provide.factory('cinema6', function($q) {
                        cinema6 = {
                            init: jasmine.createSpy('cinema6.init()'),
                            getSession: jasmine.createSpy('cinema6.getSiteSession()').andCallFake(function() {
                                return cinema6._.getSessionResult.promise;
                            }),
                            requestTransitionState: jasmine.createSpy('cinema6.requestTransitionState()').andCallFake(function() {
                                return cinema6._.requestTransitionStateResult.promise;
                            }),
                            getAppData: jasmine.createSpy('cinema6.getAppData()').andCallFake(function() {
                                return cinema6._.getAppDataResult.promise;
                            }),
                            _: {
                                getSessionResult: $q.defer(),
                                requestTransitionStateResult: $q.defer(),
                                getAppDataResult: $q.defer()
                            }
                        };

                        return cinema6;
                    });
                    $provide.value('c6ImagePreloader', c6ImagePreloader);
                });

                module('c6.screenjackinator', function($provide) {
                    $provide.value('gsap', gsap);
                    $provide.value('fail', fail);
                    $provide.value('googleAnalytics', googleAnalytics);
                    $provide.value('ProjectService', ProjectService);
                    $provide.value('VideoService', VideoService);
                    $provide.value('VoiceTrackService', VoiceTrackService);
                });

                inject(function(_$rootScope_, _$q_, _$timeout_, $controller, _$httpBackend_, c6EventEmitter) {
                    $rootScope = _$rootScope_;
                    $q = _$q_;
                    $timeout = _$timeout_;
                    $httpBackend = _$httpBackend_;
                    $scope = _$rootScope_.$new();

                    $httpBackend.expectGET('assets/collateral/app.config.json')
                        .respond(200, appConfig);

                    AppCtrl = $controller('AppController', {
                        $scope: $scope
                    });

                    cinema6Session = c6EventEmitter({});
                });
            });

            it('should exist',function() {
                expect(AppCtrl).toBeDefined();
            });

            it('should publish itself to the $scope', function() {
                expect($scope.AppCtrl).toBe(AppCtrl);
            });

            it('should tell the VideoService to listen on its scope', function() {
                expect(VideoService.listenOn).toHaveBeenCalledWith($scope);
            });

            describe('getting a project', function() {
                it('should get the appConfig', function() {
                    $httpBackend.flush();
                });

                it('then should request app data from the cinema6', function() {
                    expect(cinema6.getAppData).toHaveBeenCalled();
                });

                it('then should then set the project property', function() {
                    $httpBackend.flush();
                    $rootScope.$apply(function() { cinema6._.getAppDataResult.resolve(appData); });

                    expect(ProjectService.new).toHaveBeenCalledWith(appConfig, appData.experience.data);
                    expect(AppCtrl.project).toBe(ProjectService._.newResult);
                });

                it('should initialize the VoiceTrackService', function() {
                    var annotations;

                    $httpBackend.flush();
                    $rootScope.$apply(function() { cinema6._.getAppDataResult.resolve(appData); });
                    annotations = ProjectService._.newResult.annotations;

                    expect(VoiceTrackService.init).toHaveBeenCalled();
                    expect(VoiceTrackService.init.mostRecentCall.args[0]).toEqual([annotations[0], annotations[2]]);
                });

                it('should "fail" if there is failure.', function() {
                    var error = 'blah blah error error blah';

                    $httpBackend.flush();
                    $rootScope.$apply(function() { cinema6._.getAppDataResult.reject(error); });

                    expect(fail).toHaveBeenCalledWith(error);
                });
            });

            describe('cinema6 integration', function() {
                var setupResult;

                beforeEach(function() {
                    var setup = cinema6.init.mostRecentCall.args[0].setup;

                    setupResult = setup(appData);
                });

                it('should initialize a session with the cinema6', function() {
                    expect(cinema6.init).toHaveBeenCalled();
                });

                it('should setup the session', function() {
                    expect(AppCtrl.experience).toBe(appData.experience);
                    expect(AppCtrl.profile).toBe(appData.profile);
                });

                it('should configure gsap', function() {
                    expect(gsap.TweenLite.ticker.useRAF).toHaveBeenCalledWith(appData.profile.raf);
                });
            });

            describe('@public', function() {
                describe('properties', function() {
                    describe('videoSrc()', function() {
                        beforeEach(function() {
                            AppCtrl.project = {
                                src: null
                            };
                        });

                        it('should be the full video url', function() {
                            expect(AppCtrl.videoSrc()).toBe(null);

                            $scope.$apply(function() { AppCtrl.project.src = 'foo.mp4'; });
                            expect(AppCtrl.videoSrc()).toBe('assets/media/foo.mp4');

                            $scope.$apply(function() { AppCtrl.project.src = 'not_over.mp4'; });
                            expect(AppCtrl.videoSrc()).toBe('assets/media/not_over.mp4');
                        });
                    });

                    describe('stylesheets()', function() {
                        it('should be an empty array if there is no project/styles', function() {
                            var stylesheets = AppCtrl.stylesheets();

                            expect(angular.isArray(stylesheets)).toBe(true);
                            expect(stylesheets.length).toBe(0);
                        });

                        it('should be an array of resolved stylesheets if there is a project/styles', function() {
                            var stylesheets;

                            $scope.$apply(function() {
                                AppCtrl.project = {
                                    styles: [
                                        {
                                            stylesheet: 'assets/collateral/test/foo/style.css'
                                        },
                                        {
                                            stylesheet: 'assets/collateral/test.css'
                                        },
                                        {
                                            stylesheet: 'assets/collateral/test/styles.css'
                                        }
                                    ]
                                };
                            });
                            stylesheets = AppCtrl.stylesheets();

                            expect(stylesheets.length).toBe(3);
                            expect(stylesheets[0]).toBe('assets/collateral/test/foo/style.css');
                            expect(stylesheets[1]).toBe('assets/collateral/test.css');
                            expect(stylesheets[2]).toBe('assets/collateral/test/styles.css');
                        });
                    });
                });
            });
        });
    });
}());
