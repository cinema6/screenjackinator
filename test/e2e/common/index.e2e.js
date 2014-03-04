(function() {
    'use strict';

    var ptor = protractor.getInstance();

    describe('index.html', function() {
        var IndexPage = require('./pages/IndexPage.js'),
            index;

        beforeEach(function() {
            index = new IndexPage(ptor);
            index.get();
        });

        it('should load an experience', function() {
            expect(ptor.isElementPresent(by.name('experience'))).toBe(true);
        });

    });
}());
