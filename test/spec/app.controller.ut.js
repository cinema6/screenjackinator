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

            var site,
                c6ImagePreloader,
                gsap,
                fail,
                googleAnalytics,
                $stateProvider,
                $state,
                ProjectService,
                VideoService,
                appData,
                siteSession,
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
                        newResult: {}
                    }
                };

                VideoService = {
                    listenOn: jasmine.createSpy('VideoService.listenOn(scope)')
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
                    $provide.factory('site', function($q) {
                        site = {
                            init: jasmine.createSpy('site.init()'),
                            getSession: jasmine.createSpy('site.getSiteSession()').andCallFake(function() {
                                return site._.getSessionResult.promise;
                            }),
                            requestTransitionState: jasmine.createSpy('site.requestTransitionState()').andCallFake(function() {
                                return site._.requestTransitionStateResult.promise;
                            }),
                            getAppData: jasmine.createSpy('site.getAppData()').andCallFake(function() {
                                return site._.getAppDataResult.promise;
                            }),
                            _: {
                                getSessionResult: $q.defer(),
                                requestTransitionStateResult: $q.defer(),
                                getAppDataResult: $q.defer()
                            }
                        };

                        return site;
                    });
                    $provide.value('c6ImagePreloader', c6ImagePreloader);
                });

                module('c6.screenjackinator', function($provide) {
                    $provide.value('gsap', gsap);
                    $provide.value('fail', fail);
                    $provide.value('googleAnalytics', googleAnalytics);
                    $provide.value('ProjectService', ProjectService);
                    $provide.value('VideoService', VideoService);
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

                    siteSession = c6EventEmitter({});
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

                it('then should request app data from the site', function() {
                    expect(site.getAppData).toHaveBeenCalled();
                });

                it('then should then set the project property', function() {
                    $httpBackend.flush();
                    $rootScope.$apply(function() { site._.getAppDataResult.resolve(appData); });

                    expect(ProjectService.new).toHaveBeenCalledWith(appConfig, appData.experience.data);
                    expect(AppCtrl.project).toBe(ProjectService._.newResult);
                });

                it('should "fail" if there is failure.', function() {
                    var error = 'blah blah error error blah';

                    $httpBackend.flush();
                    $rootScope.$apply(function() { site._.getAppDataResult.reject(error); });

                    expect(fail).toHaveBeenCalledWith(error);
                });
            });

            describe('site integration', function() {
                var setupResult,
                    srcResult;

                beforeEach(function() {
                    var setup = site.init.mostRecentCall.args[0].setup;

                    srcResult = {};
                    spyOn(AppCtrl, 'src').andReturn(srcResult);

                    appData.experience.img.hero = {};

                    setupResult = setup(appData);
                });

                it('should initialize a session with the site', function() {
                    expect(site.init).toHaveBeenCalled();
                });

                it('should setup the session', function() {
                    expect(AppCtrl.experience).toBe(appData.experience);
                    expect(AppCtrl.profile).toBe(appData.profile);

                    expect(setupResult).toBe(c6ImagePreloader._.loadResult);
                    expect(AppCtrl.src).toHaveBeenCalledWith(appData.experience.img.hero);
                    expect(c6ImagePreloader.load.mostRecentCall.args[0][0]).toBe(srcResult);
                });

                it('should configure gsap', function() {
                    expect(gsap.TweenLite.ticker.useRAF).toHaveBeenCalledWith(appData.profile.raf);
                });

                describe('working with the session', function() {
                    beforeEach(function() {
                        $scope.$apply(function() { site._.getSessionResult.resolve(siteSession); });

                        spyOn(AppCtrl, 'goto');
                    });

                    it('should get the siteSession', function() {
                        expect(site.getSession).toHaveBeenCalled();
                    });

                    it('should call AppCtrl.goto(\'landing\') when the site requests it', function() {
                        siteSession.emit('gotoState', 'experience');

                        expect(AppCtrl.goto).not.toHaveBeenCalled();

                        siteSession.emit('gotoState', 'start');
                        expect(AppCtrl.goto).toHaveBeenCalledWith('landing');
                    });
                });
            });

            describe('when $stateChangeStart is fired', function() {
                var fromState;

                beforeEach(function() {
                    spyOn(AppCtrl, 'goto').andCallFake(function(state) {
                        $rootScope.$broadcast('$stateChangeStart', { name: state }, {}, { name: fromState });
                    });
                });

                describe('on initial landing page load', function() {
                    beforeEach(function() {
                        $scope.$new().$on('$stateChangeStart', function(event) {
                            expect(event.defaultPrevented).toBe(false);
                        });
                        $rootScope.$broadcast('$stateChangeStart', { name: 'landing' }, {},  { name: '' });
                    });

                    it('should do nothing', function() {
                        expect(site.requestTransitionState).not.toHaveBeenCalled();
                        expect(AppCtrl.goto).not.toHaveBeenCalled();
                    });
                });

                describe('on first transition to experience', function() {
                    var event,
                        unregister;

                    beforeEach(function() {
                        event = {
                            preventDefault: jasmine.createSpy('event.preventDefault()')
                        };

                        unregister = $scope.$new().$on('$stateChangeStart', function(event) {
                            expect(event.defaultPrevented).toBe(true);
                        });
                        $rootScope.$broadcast('$stateChangeStart', { name: 'experience' }, {}, { name: 'landing' });
                    });

                    it('should requestTransitionState(true) from the site', function() {
                        expect(site.requestTransitionState).toHaveBeenCalledWith(true);
                    });

                    describe('after the transition state is entered', function() {
                        beforeEach(function() {
                            unregister();

                            unregister = $scope.$new().$on('$stateChangeStart', function(event) {
                                expect(event.defaultPrevented).toBe(false);
                            });
                            fromState = 'landing';
                            $rootScope.$apply(function() { site._.requestTransitionStateResult.resolve(); });
                        });

                        it('should transition to the state', function() {
                            expect(AppCtrl.goto).toHaveBeenCalledWith('experience');
                        });

                        it('should requestTransitionState(false) from the site', function() {
                            expect(site.requestTransitionState).toHaveBeenCalledWith(false);
                        });

                        it('should rerun this whole procedure during the next transisition', function() {
                            unregister();

                            $timeout.flush();

                            unregister = $scope.$new().$on('$stateChangeStart', function(event) {
                                expect(event.defaultPrevented).toBe(true);
                            });

                            fromState = 'experience';
                            AppCtrl.goto('landing');
                        });
                    });
                });
            });

            describe('when $stateChangeSuccess is fired', function() {
                beforeEach(function() {
                    $rootScope.$broadcast('$stateChangeSuccess', { name: 'landing' }, {}, { name: '' });
                });

                it('should send an event to Google Analytics', function() {
                    expect(googleAnalytics).toHaveBeenCalledWith('send', 'event', '$state', 'changed', 'landing');

                    $rootScope.$broadcast('$stateChangeSuccess', { name: 'experience' }, {}, { name: 'landing' });

                    expect(googleAnalytics).toHaveBeenCalledWith('send', 'event', '$state', 'changed', 'experience');
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
                                            stylesheet: 'test/foo/style.css'
                                        },
                                        {
                                            stylesheet: 'test.css'
                                        },
                                        {
                                            stylesheet: 'test/styles.css'
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

                describe('methods', function() {
                    describe('goto(state)', function() {
                        it('should proxy to $state.go(state)', function() {
                            AppCtrl.goto('experience');

                            expect($state.go).toHaveBeenCalledWith('experience');
                        });
                    });

                    describe('img(src)', function() {
                        it('should append a different modifier based on different profile properties', function() {
                            var src = 'test/foo.jpg';

                            AppCtrl.profile = appData.profile;
                            expect(AppCtrl.src()).toBe(null);

                            AppCtrl.profile = undefined;
                            expect(AppCtrl.src(src)).toBe(null);

                            AppCtrl.profile = appData.profile;

                            appData.profile.speed = 'slow';
                            appData.profile.webp = false;
                            expect(AppCtrl.src(src)).toBe('test/foo--low.jpg');

                            appData.profile.speed = 'average';
                            expect(AppCtrl.src(src)).toBe('test/foo--med.jpg');

                            appData.profile.speed = 'fast';
                            expect(AppCtrl.src(src)).toBe('test/foo--high.jpg');

                            appData.profile.speed = 'slow';
                            appData.profile.webp = true;
                            expect(AppCtrl.src(src)).toBe('test/foo--low.jpg');

                            appData.profile.speed = 'average';
                            expect(AppCtrl.src(src)).toBe('test/foo--med.webp');

                            appData.profile.speed = 'fast';
                            expect(AppCtrl.src(src)).toBe('test/foo--high.webp');
                        });
                    });
                });
            });
        });
    });
}());
