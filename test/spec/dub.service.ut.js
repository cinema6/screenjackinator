(function() {
    'use strict';

    define(['services'], function() {
        describe('DubService', function() {
            var $rootScope,
                $httpBackend,
                $q,
                $timeoutProvider,
                DubService,
                DubServiceProvider;

            var $timeout;

            beforeEach(function() {
                $timeout = jasmine.createSpy('$timeout()');

                module('c6.screenjackinator.services', function($provide, $injector) {
                    var real$Timeout;

                    DubServiceProvider = $injector.get('DubServiceProvider');
                    $timeoutProvider = $injector.get('$timeoutProvider');

                    real$Timeout = $injector.invoke($timeoutProvider.$get);
                    $timeout.andCallFake(real$Timeout);
                    $timeout.flush = real$Timeout.flush;

                    $provide.value('$timeout', $timeout);
                });

                inject(function($injector) {
                    $rootScope = $injector.get('$rootScope');
                    $httpBackend = $injector.get('$httpBackend');
                    $q = $injector.get('$q');
                    DubService = $injector.get('DubService');
                });
            });

            describe('the provider', function() {
                it('should exist', function() {
                    expect(DubServiceProvider).toBeDefined();
                });

                it('should publish its _private object under test', function() {
                    expect(DubServiceProvider._private).toEqual(jasmine.any(Object));
                });

                describe('@public', function() {
                    describe('methods', function() {
                        describe('useDubAt(url)', function() {
                            var url,
                                result;

                            beforeEach(function() {
                                url = {};

                                result = DubServiceProvider.useDubAt(url);
                            });

                            it('should be chainable', function() {
                                expect(result).toBe(DubServiceProvider);
                            });

                            it('should set dubUrl property', function() {
                                expect(DubServiceProvider._private.dubUrl).toBe(url);
                            });
                        });
                    });
                });
            });

            describe('the service', function() {
                beforeEach(function() {
                    DubServiceProvider._private.dubUrl = 'http://cinema6.com/dub';
                });

                it('should exist', function() {
                    expect(DubService).toBeDefined();
                });

                it('should publish its _private object under test', function() {
                    expect(DubService._private).toEqual(jasmine.any(Object));
                });

                describe('@private', function() {
                    describe('methods', function() {
                        describe('handleDubResponse(response, deferred)', function() {
                            var deferred,
                                spy,
                                failSpy;

                            beforeEach(function() {
                                spy = jasmine.createSpy('promise handler');
                                failSpy = jasmine.createSpy('promise fail');
                                deferred = $q.defer();

                                deferred.promise.then(spy, failSpy);
                            });

                            describe('status 201', function() {
                                var response;

                                beforeEach(function() {
                                    response = {
                                        status: 201,
                                        data: {
                                            output: 'http://www.foo.com/test'
                                        }
                                    };

                                    $rootScope.$apply(function() {
                                        DubService._private.handleDubResponse(response, deferred);
                                    });
                                });

                                it('should resolve the provided deferred with the output url', function() {
                                    expect(spy).toHaveBeenCalledWith(response.data.output);
                                });
                            });

                            describe('status 202', function() {
                                var response;

                                beforeEach(function() {
                                    response = {
                                        status: 202,
                                        data: {
                                            jobId: '12345',
                                            host: 'dub1.cinema6.com'
                                        }
                                    };

                                    $rootScope.$apply(function() {
                                        DubService._private.handleDubResponse(response, deferred);
                                    });
                                });

                                it('should not resolve the promise', function() {
                                    expect(spy).not.toHaveBeenCalled();
                                });

                                it('should check the status of the job after one second', function() {
                                    expect($timeout).toHaveBeenCalledWith(jasmine.any(Function), 1000);
                                });

                                describe('after the $timeout', function() {
                                    var responseData,
                                        expectGET;

                                    beforeEach(function() {
                                        responseData = {};

                                        spyOn(DubService._private, 'handleDubResponse');

                                        expectGET = $httpBackend.expectGET('http://cinema6.com/dub/track/status/12345?host=dub1.cinema6.com');
                                        expectGET.respond(202, responseData);

                                        $timeout.flush();
                                    });

                                    it('should GET the status of the request', function() {
                                        $httpBackend.flush();
                                    });

                                    it('should call handleDubResponse with the response and deferred', function() {
                                        $httpBackend.flush();

                                        expect(DubService._private.handleDubResponse).toHaveBeenCalledWith(jasmine.any(Object), deferred);
                                        expect(DubService._private.handleDubResponse.mostRecentCall.args[0].data).toBe(responseData);
                                    });

                                    describe('in the event of an error', function() {
                                        beforeEach(function() {
                                            expectGET.respond(404);
                                        });

                                        it('should reject the deferred', function() {
                                            $httpBackend.flush();

                                            expect(failSpy).toHaveBeenCalledWith(jasmine.any(Object));
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

                describe('@public', function() {
                    describe('methods', function() {
                        describe('getMP3(text, options)', function() {
                            var result,
                                options,
                                expectPOST,
                                responseData,
                                failSpy;

                            beforeEach(function() {
                                failSpy = jasmine.createSpy('promise fail');

                                responseData = {};

                                options = {
                                    voice: 'dave',
                                    effect: 'R',
                                    level: 2
                                };

                                spyOn(DubService._private, 'handleDubResponse');

                                expectPOST = $httpBackend.expectPOST('http://cinema6.com/dub/track/create', {
                                    data: { tts: options, line: 'Hello, TTS!'}
                                });
                                expectPOST.respond(201, responseData);

                                result = DubService.getMP3('Hello, TTS!', options);
                                result.then(null, failSpy);
                            });

                            it('should return a promise', function() {
                                expect(angular.isFunction(result.then)).toBe(true);
                            });

                            it('should post the job to dub', function() {
                                $httpBackend.flush();
                            });

                            it('should reject the promise if it fails', function() {
                                expectPOST.respond(404, {});
                                $httpBackend.flush();

                                expect(failSpy).toHaveBeenCalledWith(jasmine.any(Object));
                            });

                            describe('after getting the response', function() {
                                beforeEach(function() {
                                    $httpBackend.flush();
                                });

                                it('should call _private.handleDubResponse', function() {
                                    var args = DubService._private.handleDubResponse.mostRecentCall.args;

                                    expect(DubService._private.handleDubResponse).toHaveBeenCalled();
                                    expect(args[0].data).toBe(responseData);
                                    expect(args[1].promise.then).toBe(result.then);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}());
