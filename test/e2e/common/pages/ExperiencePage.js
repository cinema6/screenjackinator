module.exports = function(ptor) {
    'use strict';

    var IndexPage = require('./IndexPage.js');

    function ExperiencePage(id) {
        var self = this;

        this.expVideo = $('#video');

        this.get = function() {
            var indexPage = new IndexPage(ptor);

            indexPage.get();

            // we need to wait for the experience element to load
            browser.wait(function() {
                return ptor.isElementPresent(by.name('experience'));
            });

            // once the experience loads we can set the experience to test
            browser.executeScript('c6Sandbox.setCurrentExperience('+id+')');

            // once the experience is set we want to switch the ptor instance
            // to the experience app/iframe/window for testing
            ptor.switchTo().frame(ptor.findElement(by.name('experience')));

            // Under normal circumstance, protractor will wait for $http, $digest, and $timeout to
            // be idle before starting the tests. This doesn't work when we're working with Angular
            // inside of an iframe. Because of this, we "ignoreSynchronization" and use good, old-
            // fashioned and reliable DOM-polling to figure out the readiness of our App.
            browser.wait(function() {
                return self.expVideo.isPresent();
            });
        }
    }

    return ExperiencePage;

};
