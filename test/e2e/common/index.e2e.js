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

        it('should include the necessary stylesheet', function() {
            expect(index.customStylesheet.getAttribute('href').then(function(href) {
                return !!href.match(/assets\/collateral\/styles\/antique\/antique\.css/);
            })).toBe(true);
        });
    });
}());
