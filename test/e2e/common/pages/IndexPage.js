module.exports = function(ptor) {
    'use strict';

    this.get = function() {
        // Load the sandbox app
        browser.driver.get('http://localhost:9000/');
    };
};
