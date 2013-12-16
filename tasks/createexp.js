module.exports = function(grunt) {
    'use strict';

    var prompt = require('prompt'),
        Q = require('q'),
        helpers = require('./resources/helpers.js');

    grunt.registerTask('createexp', 'Create a Cinema6 experience', function() {
        var settings = grunt.config.get('settings'),
            pkg = grunt.config.get('package'),
            experiences = grunt.file.exists(settings.experiencesJSON) ?
                grunt.file.readJSON(settings.experiencesJSON) : [],
            experience = {
                id: helpers.genId('e'),
                uri: null,
                appUriPrefix: '<%= settings.appUrl %>',
                appUri: null,
                title: null,
                subtitle: null,
                summary: null,
                img: {
                    hero: null,
                    tag: null
                },
                landingPageContent: {
                    middle: null,
                    right: null,
                    stylesheet: null
                },
                data: {}
            },
            getInput = Q.nbind(prompt.get, prompt),
            done = this.async();

        function copy(src, dest) {
            for (var key in src) {
                dest[key] = src[key];
            }
        }

        function handleError(error) {
            grunt.fail.fatal(error);
        }

        function modifyProject() {
            function collateral(src) {
                return settings.collateralDir + '/' + src;
            }

            function copyImgSet(src) {
                var seed = 'tasks/resources/hero--sample.',
                    seeds = {
                        jpg: seed + 'jpg',
                        webp: seed + 'webp'
                    },
                    unprocessedSrc = src.slice(0, src.lastIndexOf('.')),
                    modifiers = [
                        '--low.jpg',
                        '--med.jpg',
                        '--high.jpg',
                        '--med.webp',
                        '--high.webp'
                    ];

                modifiers.forEach(function(modifier) {
                    var ext = modifier.slice(modifier.lastIndexOf('.') + 1),
                        file = unprocessedSrc + modifier;

                    grunt.file.copy(seeds[ext], file);
                    grunt.log.ok('Created ' + file);
                });
            }

            grunt.log.writeln('Generated Experience:');
            grunt.log.write(JSON.stringify(experience, null, '    ') + '\n');

            experiences.push(experience);

            // Add to experiences.json and write
            grunt.file.write(settings.experiencesJSON, JSON.stringify(experiences, null, '    '));
            grunt.log.ok('Wrote to ' + settings.experiencesJSON);

            // Create files in collateral directory
            Object.keys(experience.landingPageContent).forEach(function(key) {
                var file = collateral(experience.landingPageContent[key]);

                grunt.file.write(file);
                grunt.log.ok('Created ' + file);
            });
            copyImgSet(collateral(experience.img.hero));
        }

        getInput([
            {
                name: 'uri',
                type: 'string',
                description: 'URI (Pretty ID)',
                default: pkg.name
            },
            {
                name: 'appUri',
                type: 'string',
                description: 'App URI (Partial URL Fed to Iframe. Only Change If You Need to Specify Route. E.g., "' + pkg.name + '/#/foo")',
                default: pkg.name
            },
            {
                name: 'title',
                type: 'string',
                description: 'Title'
            },
            {
                name: 'subtitle',
                type: 'string',
                description: 'Subtitle'
            },
            {
                name: 'summary',
                type: 'string',
                description: 'Summary'
            }
        ])
        .then(function(result) {
            copy(result, experience);

            return getInput([
                {
                    name: 'hero',
                    type: 'string',
                    description: 'Hero IMG Src (Relative to ' + settings.collateralDir + ' Folder)',
                    default: 'experiences/' + experience.uri + '/assets/' + experience.uri + '__hero.jpg'
                },
                {
                    name: 'middle',
                    type: 'string',
                    description: 'Middle Template Src (Relative to ' + settings.collateralDir + ' Folder)',
                    default: 'experiences/' + experience.uri + '/middle.html'
                },
                {
                    name: 'right',
                    type: 'string',
                    description: 'Right Template Src (Relative to ' + settings.collateralDir + ' Folder)',
                    default: 'experiences/' + experience.uri + '/right.html'
                },
                {
                    name: 'stylesheet',
                    type: 'string',
                    description: 'Stylesheet Src (Relative to ' + settings.collateralDir + ' Folder)',
                    default: 'experiences/' + experience.uri + '/assets/styles.css'
                }
            ]);
        })
        .then(function(result) {
            experience.img.hero = result.hero;
            experience.landingPageContent.middle = result.middle;
            experience.landingPageContent.right = result.right;
            experience.landingPageContent.stylesheet = result.stylesheet;
        })
        .then(modifyProject)
        .then(done, handleError);
    });
};
