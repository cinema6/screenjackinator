(function() {
    'use strict';

    define(['app'], function() {
        describe('ProjectService', function() {
            var ProjectService;

            var appConfig,
                videoConfig;

            beforeEach(function() {
                appConfig = {
                    voices: [
                        {
                            name: 'Paul'
                        },
                        {
                            name: 'Susan'
                        },
                        {
                            name: 'Dave'
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
                            name: 'pop',
                            src: 'pop.mp3'
                        },
                        {
                            name: 'tritone',
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
                    length: 61
                };

                module('c6.screenjackinator');

                inject(function($injector) {
                    ProjectService = $injector.get('ProjectService');
                });
            });

            it('should exist', function() {
                expect(ProjectService).toBeDefined();
            });

            describe('@public', function() {
                describe('methods', function() {
                    describe('new(appConfig, videoConfig)', function() {
                        var project;

                        beforeEach(function() {
                            project = ProjectService.new(appConfig, videoConfig);
                        });
                    });
                });
            });
        });
    });
}());
