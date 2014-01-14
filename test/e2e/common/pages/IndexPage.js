module.exports = function(ptor) {
    'use strict';

    this.video = $('#video');
    this.customStylesheet = $('link.custom-styles');

    this.get = function() {
        // Load the sandbox app
        browser.driver.get('http://localhost:9000/');
        // Switch to the experience app

        browser.wait(function() {
            return ptor.isElementPresent(by.name('experience'));
        });
        ptor.switchTo().frame(ptor.findElement(by.name('experience')));
    };
};
