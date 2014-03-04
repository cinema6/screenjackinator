(function() {
    'use strict';

    describe('the experiences', function() {
        var ptor = protractor.getInstance(),
            ExperiencePage = require('./pages/ExperiencePage.js')(ptor),
            experiencePage;

        describe('the Notebook experience', function() {
            beforeEach(function() {
                experiencePage = new ExperiencePage(0);
                experiencePage.get();
            });

            it('should include the necessary stylesheet', function() {
                var customStylesheet = element(by.className('custom-styles'));

                expect(customStylesheet.getAttribute('href').then(function(href) {
                    return !!href.match(/assets\/collateral\/styles\/antique\/antique\.css/);
                })).toBe(true);
            });

            it('should show the Notebook video', function() {
                expect(experiencePage.expVideo.getAttribute('src').then(function(src){
                    return !!src.match(/assets\/media\/not_over.mp4/);
                })).toBe(true);
            });

        });

        describe('the 2001 experience', function() {
            beforeEach(function() {
                experiencePage = new ExperiencePage(1);
                experiencePage.get();
            });

            it('should get the 2001 video', function() {
                expect(experiencePage.expVideo.getAttribute('src').then(function(src){
                    return !!src.match(/assets\/media\/2001.mp4/);
                })).toBe(true);
            });

            it('should not be showing any of the annotations', function() {
                var c6lines = element.all(by.tagName('c6-line'));
                browser.driver.angular.forEach(c6lines, function(line) {
                    expect(line.isDisplayed).toBe(false);
                });
            });

            describe('clicking the nodes', function() {
                var nodes;

                beforeEach(function() {
                    nodes = element.all(by.repeater('node in state.nodes()'));
                });

                describe('clicking the first node', function() {

                });
            });
        });

    });


    // the original:

    // xdescribe('the experience page', function() {
    //     var ptor = protractor.getInstance(),
    //         ExperiencePage = require('./pages/ExperiencePage.js')(ptor),
    //         experiencePage;

    //     beforeEach(function() {
    //         experiencePage = new ExperiencePage();

    //         experiencePage.get();
    //     });

    //     it('should display the video', function() {
    //         expect(experiencePage.video.isDisplayed()).toBe(true);
    //     });
    // });
}());
