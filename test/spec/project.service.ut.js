(function() {
    'use strict';

    define(['app'], function() {
        describe('ProjectService', function() {
            var ProjectService,
                _private;

            var appConfig,
                videoConfig;

            function isCache(object) {
                return !!(object &&
                    object.info &&
                    object.put &&
                    object.get &&
                    object.remove &&
                    object.removeAll &&
                    object.destroy);
            }

            beforeEach(function() {
                appConfig = {
                    voices: [
                        {
                            id: 'Paul'
                        },
                        {
                            id: 'Susan'
                        },
                        {
                            id: 'Dave'
                        }
                    ],
                    voiceFx: [
                        {
                            id: 'P'
                        },
                        {
                            id: 'R'
                        },
                        {
                            id: 'D'
                        }
                    ],
                    styles: [
                        {
                            id: 'antique',
                            name: 'Antique',
                            class: 'antique',
                            stylesheet: 'antique.css'
                        },
                        {
                            id: 'karate',
                            name: 'Karate',
                            class: 'karate',
                            stylesheet: 'karate.css'
                        }
                    ],
                    sfx: [
                        {
                            id: 'pop',
                            src: 'pop.mp3'
                        },
                        {
                            id: 'tritone',
                            src: 'tritone.mp3'
                        }
                    ]
                };

                videoConfig = {
                    styles: [
                        {
                            id: 'antique',
                            name: 'Antique',
                            class: 'antique',
                            stylesheet: 'antique.css'
                        }
                    ],
                    sfx: [
                        {
                            name: 'pop',
                            src: 'pop.mp3'
                        }
                    ],
                    length: 61,
                    thumbs: ['notebook/thumbs/beginning.jpg', 'notebook/thumbs/middle.png', 'notebook/thumbs/end.jpg'],
                    features: ['popup'],
                    annotations: [
                        {
                            type: 'popup',
                            timestamp: 5,
                            duration: 2,
                            text: 'What\'s up?!',
                            maxChars: 15
                        },
                        {
                            type: 'popup',
                            timestamp: 12,
                            duration: 2,
                            text: 'How are you?!',
                            maxChars: 15
                        },
                        {
                            type: 'popup',
                            timestamp: 33,
                            duration: 4,
                            text: 'This is the final test.',
                            maxChars: 15
                        }
                    ],
                    defaults: {
                        style: 'antique',
                        permissions: {
                            add: false,
                            delete: false,
                            modifyTimestamp: false,
                            modifyDuration: false,
                            modifyText: true,
                            modifyStyle: false
                        }
                    }
                };

                module('c6.screenjackinator');

                inject(function($injector) {
                    ProjectService = $injector.get('ProjectService');
                    _private = ProjectService._private;
                });
            });

            it('should exist', function() {
                expect(ProjectService).toBeDefined();
            });

            it('should publish its _private object', function() {
                expect(_private).toBeDefined();
            });

            describe('@private', function() {
                describe('constructors', function() {
                    describe('Project', function() {
                        var project;

                        beforeEach(function() {
                            project = new _private.Project(appConfig, videoConfig);
                        });
                    });

                    describe('Model', function() {
                        var model,
                            config;

                        beforeEach(function() {
                            config = {
                                id: 'foo',
                                test: 'hey',
                                another: {}
                            };

                            model = new _private.Model(config);
                        });

                        describe('properties', function() {
                            describe('name', function() {
                                it('should be the name of the constructor', function() {
                                    expect(model.name).toBe('Model');
                                });
                            });

                            describe('id', function() {
                                it('should use the config object', function() {
                                    expect(model.id).toBe('foo');
                                });
                            });
                        });

                        describe('methods', function() {
                            describe('setupWith(config)', function() {
                                beforeEach(function() {
                                    model.setupWith(config);
                                });

                                it('should copy all the properties to itself', function() {
                                    expect(model.test).toBe(config.test);
                                    expect(model.another).toBe(config.another);
                                });
                            });

                            describe('cache', function() {
                                beforeEach(function() {
                                    spyOn(_private.cache, 'put').andCallThrough();

                                    model.cache();
                                });

                                it('should create a cache for this type', function() {
                                    var cache = _private.cache.get('Model');

                                    expect(isCache(cache)).toBe(true);
                                });

                                it('should add itself to the proper cache', function() {
                                    expect(_private.cache.get('Model').get('foo')).toBe(model);
                                });

                                it('should store multiple items in its cache', function() {
                                    var anotherModel = new _private.Model({ id: 'test' });

                                    anotherModel.cache();

                                    expect(_private.cache.get('Model').get('foo')).toBe(model);
                                    expect(_private.cache.get('Model').get('test')).toBe(anotherModel);
                                });
                            });
                        });
                    });

                    describe('Voice', function() {
                        var voice,
                            config;

                        beforeEach(function() {
                            config = {
                                id: 'myvoice'
                            };
                            spyOn(_private.Voice.prototype, 'setupWith').andCallThrough();
                            voice = new _private.Voice(config);
                        });

                        it('should inherit from the model', function() {
                            expect(_private.Voice.prototype instanceof _private.Model).toBe(true);
                            expect(voice.constructor).toBe(_private.Voice);
                        });

                        it('should set itself up with the passed config', function() {
                            expect(voice.setupWith).toHaveBeenCalledWith(config);
                        });
                    });
                });

                describe('properties', function() {
                    describe('cache', function() {
                        it('should create a cache for the service', function() {
                            var cache = _private.cache;

                            expect(isCache(cache)).toBe(true);
                        });
                    });
                });
            });

            describe('@public', function() {
                describe('methods', function() {
                    describe('new(appConfig, videoConfig)', function() {
                        var project,
                            mockProject;

                        beforeEach(function() {
                            mockProject = {};

                            spyOn(_private, 'Project').andReturn(mockProject);
                            project = ProjectService.new(appConfig, videoConfig);
                        });

                        it('should create a new Project', function() {
                            expect(_private.Project).toHaveBeenCalledWith(appConfig, videoConfig);
                            expect(project).toBe(mockProject);
                        });
                    });
                });
            });
        });
    });
}());
