module.exports = function(ptor) {
    'use strict';

    var LandingPage = require('./LandingPage.js')(ptor);

    function ExperiencePage() {
        this.section = $('ui-view section#experience');
        this.video = $('ui-view section#experience #video');

        this.get = function() {
            var landingPage = new LandingPage();

            landingPage.get();
            landingPage.playBtn.click();
        };
    }

    return ExperiencePage;
};
