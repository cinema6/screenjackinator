module.exports = function(ptor) {
    'use strict';

    // function LandingPage() {
    //     var self = this;

    //     this.hero = $('.exp-hero__group');
    //     this.playBtn = $('.exp-hero-slides__link');

    //     this.get = function() {
    //         var IndexPage = require('./IndexPage.js'),
    //             indexPage = new IndexPage(ptor);

    //         indexPage.get();
    //         // Under normal circumstance, protractor will wait for $http, $digest, and $timeout to
    //         // be idle before starting the tests. This doesn't work when we're working with Angular
    //         // inside of an iframe. Because of this, we "ignoreSynchronization" and use good, old-
    //         // fashioned and reliable DOM-polling to figure out the readiness of our App.
    //         browser.wait(function() {
    //             return self.hero.isPresent();
    //         });
    //     };
    // }

    // return LandingPage;
};
