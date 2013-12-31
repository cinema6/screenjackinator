(function() {
    'use strict';

    define(['services'], function() {
        describe('ProjectService', function() {
            var ProjectService,
                $cacheFactory,
                _private;

            var c6Sfx,
                c6VideoService,
                soundFx;

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
                spyOn(angular, 'copy').andCallThrough();
                spyOn(angular, 'extend').andCallThrough();

                c6VideoService = {
                    bestFormat: jasmine.createSpy('c6VideoService.bestFormat(formats)').andReturn('video/mp4'),
                    extensionForFormat: jasmine.createSpy('c6VideoService.extensionForFormat(format)').andReturn('mp4')
                };

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
                            modifier: 'antique',
                            stylesheet: 'antique.css'
                        },
                        {
                            id: 'karate',
                            name: 'Karate',
                            modifier: 'karate',
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
                    src: 'not_over',
                    styles: [
                        {
                            id: 'antique',
                            name: 'Antique',
                            modifier: 'antique',
                            stylesheet: 'antique.css'
                        }
                    ],
                    sfx: [
                        {
                            id: 'pop',
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
                        sfx: 'pop',
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

                soundFx = {
                    name: 'sfx'
                };

                module('c6.ui', function($provide) {
                    $provide.value('c6VideoService', c6VideoService);

                    $provide.provider('c6Sfx', function() {
                        this.$get = function($q) {
                            var service = {
                                loadSounds: jasmine.createSpy('c6Sfx.loadSounds(configs)').andCallFake(function() {
                                    return service._.loadSoundsDeferred.promise;
                                }),
                                getSoundByName: jasmine.createSpy('c6Sfx.getSoundByName(name)').andCallFake(function(name) {
                                    if (name === 'sfx') {
                                        return soundFx;
                                    }
                                }),
                                _: {
                                    loadSoundsDeferred: $q.defer(),
                                    loadSoundsResult: [soundFx]
                                }
                            };

                            return service;
                        };
                    });
                });

                module('c6.screenjackinator');

                inject(function($injector) {
                    ProjectService = $injector.get('ProjectService');
                    $cacheFactory = $injector.get('$cacheFactory');
                    c6Sfx = $injector.get('c6Sfx');
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
                            describe('_type', function() {
                                it('should be the name of the constructor', function() {
                                    expect(model._type).toBe('Model');
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
                                var result;

                                beforeEach(function() {
                                    spyOn(_private.cache, 'put').andCallThrough();

                                    result = model.cache();
                                });

                                it('should create a cache for this type', function() {
                                    var cache = _private.cache.get('Model');

                                    expect(isCache(cache)).toBe(true);
                                });

                                it('should add itself to the proper cache', function() {
                                    expect(_private.cache.get('Model').get('foo')).toBe(model);
                                });

                                it('should return itself', function() {
                                    expect(result).toBe(model);
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
                            expect(voice._type).toBe('Voice');
                        });

                        it('should set itself up with the passed config', function() {
                            expect(voice.setupWith).toHaveBeenCalledWith(config);
                        });
                    });

                    describe('VoiceFx', function() {
                        var voiceFx,
                            config;

                        beforeEach(function() {
                            config = {
                                id: 'testVoiceFx'
                            };

                            spyOn(_private.VoiceFx.prototype, 'setupWith').andCallThrough();
                            voiceFx = new _private.VoiceFx(config);
                        });

                        it('should inherit from the model', function() {
                            expect(_private.VoiceFx.prototype instanceof _private.Model).toBe(true);
                            expect(voiceFx.constructor).toBe(_private.VoiceFx);
                            expect(voiceFx._type).toBe('VoiceFx');
                        });

                        it('should set itself up with the passed config', function() {
                            expect(voiceFx.setupWith).toHaveBeenCalledWith(config);
                        });
                    });

                    describe('Style', function() {
                        var style,
                            config;

                        beforeEach(function() {
                            config = {
                                id: 'testStyle',
                                stylesheet: 'themes/antique/styles.css'
                            };

                            spyOn(_private.Style.prototype, 'setupWith').andCallThrough();
                            style = new _private.Style(config);
                        });

                        it('should inherit from the model', function() {
                            expect(_private.Style.prototype instanceof _private.Model).toBe(true);
                            expect(style.constructor).toBe(_private.Style);
                            expect(style._type).toBe('Style');
                        });

                        it('should set itself up with the passed config', function() {
                            expect(style.setupWith).toHaveBeenCalledWith(config);
                        });

                        it('should expand the stylesheet to a collateral href', function() {
                            expect(style.stylesheet).toBe('assets/collateral/themes/antique/styles.css');
                        });
                    });

                    describe('Sfx', function() {
                        var sfx,
                            config;

                        beforeEach(function() {
                            config = {
                                id: 'sfx',
                                name: 'sfx',
                                src: 'sounds/my_sfx'
                            };

                            sfx = new _private.Sfx(config);
                        });

                        it('should expand the src to a collateral src', function() {
                            expect(config.src).toBe('assets/collateral/sounds/my_sfx');
                        });

                        it('return a sfx created by c6Sfx', function() {
                            expect(c6Sfx.loadSounds).toHaveBeenCalled();
                            expect(c6Sfx.loadSounds.mostRecentCall.args[0][0]).toBe(config);
                            expect(c6Sfx.getSoundByName).toHaveBeenCalledWith('sfx');
                            expect(sfx).toBe(soundFx);
                        });

                        it('should have a _type property of Sfx', function() {
                            expect(sfx._type).toBe('Sfx');
                        });

                        it('should have an id property', function() {
                            expect(sfx.id).toBe(config.id);
                        });

                        it('should give the sfx the model\'s cache method', function() {
                            expect(sfx.cache).toBe(_private.Model.prototype.cache);
                        });
                    });

                    describe('Annotation', function() {
                        var annotation,
                            config,
                            mockStyle,
                            anotherStyle,
                            mockSfx,
                            mockVoice;

                        beforeEach(function() {
                            config = {
                                id: 'testAnnotation'
                            };

                            mockStyle = {
                                id: 'antique'
                            };
                            anotherStyle = {
                                id: 'karate'
                            };
                            mockSfx = {
                                id: 'pop'
                            };
                            mockVoice = {
                                id: 'dave'
                            };

                            spyOn(_private, 'get').andCallFake(function(type, config) {
                                if (type === 'Style') {
                                    if (config.id === 'antique') {
                                        return mockStyle;
                                    } else if (config.id === 'karate') {
                                        return anotherStyle;
                                    }
                                } else if (type === 'Sfx') {
                                    if (config.id === 'pop') {
                                        return mockSfx;
                                    }
                                } else if (type === 'Voice') {
                                    if (config.id === 'dave') {
                                        return mockVoice;
                                    }
                                }
                            });

                            spyOn(_private.Annotation.prototype, 'setupWith').andCallThrough();
                            annotation = new _private.Annotation(config, videoConfig.defaults);
                        });

                        it('should inherit from the model', function() {
                            expect(_private.Annotation.prototype instanceof _private.Model).toBe(true);
                            expect(annotation.constructor).toBe(_private.Annotation);
                            expect(annotation._type).toBe('Annotation');
                        });

                        it('should set itself up with the passed config', function() {
                            expect(annotation.setupWith).toHaveBeenCalledWith(config);
                        });

                        it('should resolve relationships', function() {
                            var newAnnotation = new _private.Annotation({
                                id: 'another',
                                style: 'karate',
                                sfx: 'pop',
                                voice: 'dave'
                            }, {});

                            expect(newAnnotation.style).toBe(anotherStyle);
                            expect(newAnnotation.sfx).toBe(mockSfx);
                            expect(newAnnotation.voice).toBe(mockVoice);
                        });

                        it('should overide any undefined properties with properties on the defaults object', function() {
                            var newConfig = { id: 'another', sfx: null },
                                newAnnotation = new _private.Annotation(newConfig, videoConfig.defaults);

                            expect(newAnnotation.permissions).toBe(videoConfig.defaults.permissions);
                            expect(newAnnotation.style).toBe(mockStyle);
                            expect(newAnnotation.sfx).toBe(null);
                        });
                    });

                    describe('Project', function() {
                        var project,
                            getResult;

                        beforeEach(function() {
                            getResult = {};

                            spyOn(_private, 'get').andReturn(getResult);

                            project = new _private.Project(appConfig, videoConfig);
                        });

                        it('should extend the project with the appConfig first, then the videoConfig', function() {
                            expect(angular.extend).toHaveBeenCalledWith(project, appConfig, videoConfig);
                        });

                        it('should convert the voices to Voices by getting them', function() {
                            appConfig.voices.forEach(function(voice, index) {
                                expect(voice.id).not.toBe(index);
                                expect(_private.get).toHaveBeenCalledWith('Voice', voice);
                            });

                            project.voices.forEach(function(voice) {
                                expect(voice).toBe(getResult);
                            });
                        });

                        it('should convert the voiceFx to VoiceFx by getting them', function() {
                            appConfig.voiceFx.forEach(function(voiceFx, index) {
                                expect(voiceFx.id).not.toBe(index);
                                expect(_private.get).toHaveBeenCalledWith('VoiceFx', voiceFx);
                            });

                            project.voiceFx.forEach(function(voiceFx) {
                                expect(voiceFx).toBe(getResult);
                            });
                        });

                        it('should convert the styles to Styles by getting them', function() {
                            videoConfig.styles.forEach(function(style, index) {
                                expect(style.id).not.toBe(index);
                                expect(_private.get).toHaveBeenCalledWith('Style', style);
                            });

                            project.styles.forEach(function(style) {
                                expect(style).toBe(getResult);
                            });
                        });

                        it('should convert the sfx to Sfx by getting them', function() {
                            videoConfig.sfx.forEach(function(fx, index) {
                                expect(fx.id).not.toBe(index);
                                expect(_private.get).toHaveBeenCalledWith('Sfx', fx);
                            });

                            project.sfx.forEach(function(fx) {
                                expect(fx).toBe(getResult);
                            });
                        });

                        it('should convert the annotations into Annotations by getting them', function() {
                            videoConfig.annotations.forEach(function(annotation, index) {
                                expect(annotation.id).toBe(index);
                                expect(_private.get).toHaveBeenCalledWith('Annotation', annotation, project.defaults);
                            });

                            project.annotations.forEach(function(annotation) {
                                expect(annotation).toBe(getResult);
                            });
                        });

                        it('should convert the thumbs to collateral urls', function() {
                            project.thumbs.forEach(function(thumb) {
                                expect(!!thumb.match(/^assets\/collateral\//)).toBe(true);
                            });
                        });

                        it('should get an extension for the src', function() {
                            expect(project.src).toBe('not_over.mp4');
                            expect(c6VideoService.bestFormat).toHaveBeenCalled();
                            expect(c6VideoService.extensionForFormat).toHaveBeenCalledWith('video/mp4');
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

                describe('methods', function() {
                    describe('get(type, data)', function() {
                        describe('if the record is already cached', function() {
                            var data,
                                dataCopy;

                            beforeEach(function() {
                                data = {
                                    id: 'foo',
                                    hello: 'test',
                                    okay: 'word'
                                };
                                dataCopy = angular.copy(data);

                                _private.cache.put('Model', $cacheFactory('project:Model')).put('foo', data);
                            });

                            it('should return a reference to the cached value', function() {
                                expect(_private.get('Model', dataCopy)).toBe(data);
                            });
                        });

                        describe('if the record isn\'t cached yet', function() {
                            var data,
                                moreData;

                            beforeEach(function() {
                                data = {
                                    id: 'test',
                                    hello: 'foo'
                                };
                                moreData = {
                                    id: 'foo'
                                };

                                spyOn(_private.Model.prototype, 'cache').andCallThrough();
                            });

                            it('should return a newly created and cached model of the specified type', function() {
                                var model = _private.get('Model', data),
                                    anotherModel = _private.get('Voice', moreData);

                                expect(model.constructor).toBe(_private.Model);
                                expect(model.cache).toHaveBeenCalled();

                                expect(anotherModel.constructor).toBe(_private.Voice);
                                expect(anotherModel.cache).toHaveBeenCalled();
                            });

                            it('should pass along arguments to the constructor', function() {
                                var model;

                                spyOn(_private, 'Model').andCallThrough();
                                // Because the spy obliterates our prototype, we need to add back the all-important cache method
                                _private.Model.prototype.cache = function() {
                                    return this;
                                };

                                model = _private.get('Model', data, moreData, 'foo');

                                expect(_private.Model).toHaveBeenCalledWith(data, moreData, 'foo');
                            });
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
