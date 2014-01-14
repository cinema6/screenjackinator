(function() {
    'use strict';

    define(['app'], function() {
        describe('fail(error)', function() {
            var fail,
                googleAnalytics,
                $log;

            beforeEach(function() {
                googleAnalytics = jasmine.createSpy('googleAnalytics()');

                $log = {
                    error: jasmine.createSpy('$log.error(err)')
                };

                module('c6.screenjackinator', function($provide) {
                    $provide.value('googleAnalytics', googleAnalytics);
                    $provide.value('$log', $log);
                });

                inject(function($injector) {
                    fail = $injector.get('fail');
                });
            });

            it('should exist', function() {
                expect(fail).toBeDefined();
            });

            describe('using the service', function() {
                beforeEach(function() {
                    fail('blah blah error blah');
                });

                it('should log the error', function() {
                    expect($log.error).toHaveBeenCalledWith('blah blah error blah');
                });

                it('should send an event to GA', function() {
                    expect(googleAnalytics).toHaveBeenCalledWith('send', 'event', 'error', 'thrown', 'blah blah error blah');
                });
            });
        });
    });
}());
