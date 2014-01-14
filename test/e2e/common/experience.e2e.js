(function() {
    'use strict';

    describe('the experience page', function() {
        var ptor = protractor.getInstance(),
            ExperiencePage = require('./pages/ExperiencePage.js')(ptor),
            experiencePage;

        beforeEach(function() {
            experiencePage = new ExperiencePage();

            experiencePage.get();
        });

        it('should display the video', function() {
            expect(experiencePage.video.isDisplayed()).toBe(true);
        });
    });
}());
