(function() {
    'use strict';

    xdescribe('the landing page', function() {
        var ptor = protractor.getInstance(),
            LandingPage = require('./pages/LandingPage.js')(ptor),
            IndexPage = require('./pages/IndexPage.js'),
            landingPage, indexPage;

        beforeEach(function() {
            indexPage = new IndexPage(ptor);
            landingPage = new LandingPage();

            landingPage.get();
        });

        describe('the hero box', function() {
            it('should be displayed', function() {
                expect(landingPage.hero.isDisplayed()).toBe(true);
            });
        });

        describe('the play button', function() {
            it('should take you to the experience', function() {
                landingPage.playBtn.click().then(function() {
                    expect($('ui-view section#experience').isDisplayed()).toBe(true);
                });
            });
        });

        describe('the video', function() {
            it('should have a loaded src', function() {
                indexPage.video.getAttribute('src').then(function(src) {
                    expect(!!src.match(/assets\/media\/not_over\.mp4$/)).toBe(true);
                });
            });
        });
    });
})();
