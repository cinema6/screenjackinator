(function() {
    'use strict';

    define(['screenjack_player'], function() {
        describe('<c6-line></c6-line>', function() {
            var $rootScope,
                $scope,
                $compile,
                $q,
                $document;

            beforeEach(function() {
                module('c6.screenjackinator');

                inject(function($injector) {
                    $rootScope = $injector.get('$rootScope');
                    $document = $injector.get('$document');
                    $compile = $injector.get('$compile');
                    $q = $injector.get('$q');

                    $scope = $rootScope.$new();
                });
            });

            describe('clicking', function() {
                var line,
                    scope;

                beforeEach(function() {
                    $scope.$apply(function() {
                        line = $compile('<c6-line editable="editable"></c6-line>')($scope);
                    });
                    scope = line.children().scope();
                });

                describe('if editable is true', function() {
                    beforeEach(function() {
                        $scope.$apply(function() {
                            $scope.editable = true;
                        });
                    });

                    it('should enter editing mode when clicked', function() {
                        line.click();
                        expect(scope.editing).toBe(true);
                    });

                    // it('should exit editing mode when anywhere outside the directive is clicked', function() {
                    //     line.click();
                    //     $document.click();
                    //     expect(scope.editing).toBe(false);
                    // });
                });

                describe('if editable is false', function() {
                    beforeEach(function() {
                        $scope.$apply(function() {
                            $scope.editable = false;
                        });
                    });

                    it('should not enter editing mode when clicked', function() {
                        line.click();
                        expect(scope.editing).not.toBe(true);
                    });
                });
            });

            it('should not $emit c6Line:editdone on initialization', function() {
                var spy = jasmine.createSpy('c6Line:editdone');

                $scope.$on('c6Line:editdone', spy);
                $scope.$apply(function() {
                    $compile('<c6-line></c6-line>')($scope);
                });

                expect(spy).not.toHaveBeenCalled();
            });

            describe('attributes', function() {
                describe('show', function() {
                    var line,
                        showSpy,
                        hideSpy,
                        boundingBox;

                    beforeEach(function() {
                        boundingBox = {};

                        showSpy = jasmine.createSpy('line show');
                        hideSpy = jasmine.createSpy('line hide');

                        $scope.$on('c6Line:show', showSpy);
                        $scope.$on('c6Line:hide', hideSpy);

                        $scope.showLine = true;
                        $scope.annotation = {
                            text : 'Hey!',
                            isValid: function(){}
                        };

                        $scope.$apply(function() {
                            line = $compile('<c6-line show="showLine" annotation="annotation">Foo</c6-line>')($scope);
                            spyOn(line[0], 'getBoundingClientRect').andReturn(boundingBox);
                        });
                    });

                    it('should be shown when true', function() {
                        expect(line.css('display')).toBe('');
                    });

                    it('should be hidden when false', function() {
                        $scope.$apply(function() {
                            $scope.showLine = false;
                        });

                        expect(line.css('display')).toBe('none');
                    });

                    it('should $emit c6Line:show when true', function() {
                        expect(showSpy).toHaveBeenCalled();

                        expect(showSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                        expect(showSpy.mostRecentCall.args[2]).toBe(boundingBox);
                    });

                    it('should $emit c6Line:hide when false', function() {
                        $scope.$apply(function() {
                            $scope.showLine = false;
                        });

                        expect(hideSpy).toHaveBeenCalled();

                        expect(hideSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                        expect(hideSpy.mostRecentCall.args[2]).toBe(boundingBox);
                    });
                });

                describe('when not editing', function() {
                    var line,
                        editDoneSpy;

                    beforeEach(function() {
                        editDoneSpy = jasmine.createSpy('edit done');

                        $scope.editing = false;
                        $scope.annotation = {
                            text: 'Hey!',
                            isVirgin: function() {return true;},
                            isValid: function(){}
                        };

                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });

                        $scope.$on('c6Line:editdone', editDoneSpy);
                    });

                    it('should hide the form', function() {
                        expect(line.find('form').hasClass('ng-hide')).toBe(true);
                    });

                    it('should show the text span', function() {
                        expect(line.find('span').css('display')).toBe('inline');
                    });

                    it('should $emit c6Line:editdone when leaving edit mode', function() {
                        expect(editDoneSpy).not.toHaveBeenCalled();

                        $scope.$apply(function() {
                            line.children().scope().editing = true;
                        });
                        $scope.$apply(function() {
                            line.children().scope().editing = false;
                        });

                        expect(editDoneSpy).toHaveBeenCalled();
                        expect(editDoneSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                    });
                });

                describe('when editing', function() {
                    var line,
                        editStartSpy;

                    beforeEach(function() {
                        editStartSpy = jasmine.createSpy('edit start');

                        $scope.annotation = {
                            text: 'Hey!',
                            isValid: function() {}
                        };

                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });
                        $scope.$on('c6Line:editstart', editStartSpy);
                        $scope.$apply(function() {
                            line.children().scope().editing = true;
                        });
                    });

                    it('should show the form', function() {
                        expect(line.find('form').css('display')).toBe('');
                    });

                    it('should hide the text span', function() {
                        expect(line.find('span').css('display')).toBe('none');
                    });

                    it('should $emit c6Line:editstart', function() {
                        expect(editStartSpy).toHaveBeenCalled();

                        expect(editStartSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                    });
                });

                describe('after editing', function() {
                    var line,
                        scope;

                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Initial Text',
                            isVirgin: function() {
                                return this.text === 'Initial Text';
                            },
                            isValid: function() {},
                            _voiceBox: {
                                addEventListener: jasmine.createSpy('annotation._voiceBox.addEventListener()')
                                    .andCallFake(function(){}),
                                removeEventListener: jasmine.createSpy('annotation._voiceBox.addEventListener()')
                                    .andCallFake(function(){})
                            },
                            getMP3: jasmine.createSpy('annotation.getMP3()')
                                .andCallFake(function() {
                                    return $scope.annotation._.getMP3Deferred.promise;
                                }),
                            speak: jasmine.createSpy('annotation.speak()')
                                .andCallFake(function() {
                                    return $scope.annotation._.speakDeferred.promise;
                                }),
                            _: {
                                getMP3Deferred: $q.defer(),
                                speakDeferred: $q.defer()
                            }
                        };

                        spyOn($scope.annotation, 'isVirgin').andCallThrough();

                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });
                        $scope.$apply(function() {
                            scope = line.children().scope();
                            scope.editing = true;
                        });
                        $scope.$apply(function() {
                            $scope.annotation.text = 'My Edit';
                        });
                    });

                    describe('clicking outside of the directive element', function() {
                        it('should exit editing mode', function() {
                            // $document.click();
                            // expect(scope.editing).toBe(false);
                        });
                    });

                    describe('clicking cancel', function() {
                        var cancel;

                        beforeEach(function() {
                            cancel = line.find('form button[name=cancel]');
                            cancel.click();
                        });

                        it('should revert the annotation text back to its pre-editing value', function() {
                            expect($scope.annotation.text).toBe('Initial Text');
                        });

                        it('should exit editing mode', function() {
                            expect(scope.editing).toBe(false);
                        });

                        it('should not add invalid css class to form element', function() {
                            expect(scope.valid).toBe(true);
                        });

                        it('should call isVirgin()', function() {
                            expect($scope.annotation.isVirgin).toHaveBeenCalled();
                        });

                        it('should not have added modified-class to container', function() {
                            expect(line.hasClass('modified-class')).toBe(false);
                        });
                    });

                    describe('clicking save', function() {
                        describe('with valid changes', function() {
                            var save;

                            beforeEach(function() {
                                spyOn($scope.annotation, 'isValid').andReturn(true);

                                save = line.find('form button[name=save]');
                                save.click();
                            });

                            it('should get the MP3 for the line', function() {
                                expect($scope.annotation.getMP3).toHaveBeenCalled();
                            });

                            describe('after getting the MP3', function() {
                                beforeEach(function() {
                                    $scope.$apply(function() {
                                        $scope.annotation._.getMP3Deferred.resolve($scope.annotation);
                                    });
                                });

                                it('should not add invalid css class to form element', function() {
                                    expect($scope.annotation.isValid).toHaveBeenCalled();
                                    expect(scope.valid).toBe(true);
                                });

                                it('should keep the changes', function() {
                                    expect($scope.annotation.text).toBe('My Edit');
                                });

                                it('should exit editing mode', function() {
                                    expect(scope.editing).toBe(false);
                                });

                                it('should call isVirgin()', function() {
                                    expect($scope.annotation.isVirgin).toHaveBeenCalled();
                                });

                                it('should have added modified-class to container', function() {
                                    expect(line.hasClass('modified-class')).toBe(true);
                                });
                            });
                        });

                        describe('with invalid changes', function() {
                            var save;

                            beforeEach(function() {
                                spyOn($scope.annotation, 'isValid').andReturn(false);

                                save = line.find('form button[name=save]');
                                save.click();
                            });

                            it('should get the MP3 for the line', function() {
                                expect($scope.annotation.getMP3).toHaveBeenCalled();
                            });

                            describe('after getting the MP3', function() {
                                beforeEach(function() {
                                    $scope.$apply(function() {
                                        $scope.annotation._.getMP3Deferred.resolve($scope.annotation);
                                    });
                                });

                                it('should add invalid css class to form element', function() {
                                    expect($scope.annotation.isValid).toHaveBeenCalled();
                                    expect(scope.valid).toBe(false);
                                });

                                it('should not exit editing mode', function() {
                                    expect(scope.editing).toBe(true);
                                });

                                it('should leave the invalid text in the field', function() {
                                    expect($scope.annotation.text).toBe('My Edit');
                                });

                                it('should not call isVirgin()', function() {
                                    expect($scope.annotation.isVirgin).not.toHaveBeenCalled();
                                });

                                it('should not have added modified-class to container', function() {
                                    expect(line.hasClass('modified-class')).toBe(false);
                                });
                            });
                        });
                    });

                    describe('clicking listen', function() {
                        var listen;

                        beforeEach(function() {
                            listen = line.find('form button[name=listen]');
                            listen.click();
                        });

                        it('should indicate fetching state', function() {
                            expect(scope.fetching).toBe(true);
                        });

                        it('should add the loading css class', function() {
                            expect(listen.hasClass('tts__listen-btn--loading')).toBeDefined();
                        });

                        it('should get the MP3', function() {
                            expect($scope.annotation.getMP3).toHaveBeenCalled();
                        });

                        it('should not have called speak()', function() {
                            expect($scope.annotation.speak).not.toHaveBeenCalled();
                        });

                        describe('after getting the MP3 with valid MP3', function() {
                            beforeEach(function() {
                                spyOn($scope.annotation, 'isValid').andReturn(true);

                                $scope.$apply(function() {
                                    $scope.annotation._.getMP3Deferred.resolve($scope.annotation);
                                });
                            });

                            it('should exit fetching state', function() {
                                expect(scope.fetching).toBe(false);
                            });

                            it('should remove the loading css class', function() {
                                expect(listen.hasClass('tts__listen-btn--loading')).toBe(false);
                            });

                            it('should add playing css class', function() {
                                expect(listen.hasClass('tts__listen-btn--playing')).toBe(true);
                            });

                            it('should not indicate invalid mp3', function() {
                                expect(scope.valid).toBe(true);
                            });

                            it('should add a timeupdate event listener to the mp3', function() {
                                expect($scope.annotation._voiceBox.addEventListener).toHaveBeenCalled();
                            });

                            it('should not remove a timeupdate event listener to the mp3', function() {
                                expect($scope.annotation._voiceBox.removeEventListener).not.toHaveBeenCalled();
                            });

                            it('should indicate listening state', function() {
                                expect(scope.listening).toBe(true);
                            });

                            it('should tell the line to speak', function() {
                                expect($scope.annotation.speak).toHaveBeenCalled();
                            });

                            it('should disable listening state after it speaks', function() {
                                $scope.$apply(function() {
                                    $scope.annotation._.speakDeferred.resolve($scope.annotation);
                                });
                                expect(scope.listening).toBe(false);
                                expect(listen.hasClass('tts__listen-btn--playing')).toBe(false);
                            });
                        });

                        describe('after getting the MP3 with invalid MP3', function() {
                            beforeEach(function() {
                                spyOn($scope.annotation, 'isValid').andReturn(false);
                                $scope.annotation._.getMP3Deferred.resolve($scope.annotation);

                                listen = line.find('form button[name=listen]');
                                listen.click();
                            });

                            it('should add invalid css class to form element', function() {
                                expect(scope.valid).toBe(false);
                            });

                            it('should not speak the line', function() {
                                expect($scope.annotation.speak).not.toHaveBeenCalled();
                            });
                        });

                        describe('while mp3 is playing (pressing stop)', function() {
                            var stopListeningSpy;

                            beforeEach(function() {
                                stopListeningSpy = jasmine.createSpy('stopListening');
                                $scope.$on('c6Line:stopListening', stopListeningSpy);
                                spyOn($scope.annotation, 'isValid').andReturn(true);

                                $scope.$apply(function() {
                                    $scope.annotation._.getMP3Deferred.resolve($scope.annotation);
                                });

                                listen = line.find('form button[name=listen]');
                                listen.click();
                            });
                            it('should disable listening state', function() {
                                expect(scope.listening).toBe(false);
                            });
                            it('should remove the timeupdate event listener', function() {
                                expect($scope.annotation._voiceBox.removeEventListener).toHaveBeenCalled();
                            });
                            it('should $emit stopListening event', function() {
                                expect(stopListeningSpy).toHaveBeenCalled();
                            });
                        });
                    });
                });

                describe('annotation', function() {
                    var line;

                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Hey!',
                            style: {
                                modifier: 'antique'
                            },
                            position: {
                                top: '50%',
                                left: '10%'
                            },
                            isValid: jasmine.createSpy('annotation.isValid()').andReturn(true)
                        };

                        $scope.$apply(function() {
                            line = $compile('<c6-line show="\'true\'" annotation="annotation"></c6-line>')($scope);
                        });
                    });

                    it('should display the text', function() {
                        expect(line.find('span')[0].innerHTML).toBe('“Hey!”');
                    });

                    it('should bind the text to a textfield', function() {
                        expect(line.find('form input[type=text]').val()).toBe('Hey!');

                        $scope.$apply(function() {
                            $scope.annotation.text = 'Foo!';
                        });

                        expect(line.find('form input[type=text]').val()).toBe('Foo!');
                    });
                });

                describe('disableprev', function() {
                    describe('when true', function() {
                        var line;
                        beforeEach(function() {
                            $scope.$apply(function() {
                                line = $compile('<c6-line disableprev="true" annotation="annotation"></c6-line>')($scope);
                            });
                        });

                        it('should hide prev button', function() {
                            expect(line.find('button.tts__prev-arrow').hasClass('ng-hide')).toBe(true);
                        });
                    });
                    describe('when false', function() {
                        var line;
                        beforeEach(function() {
                            $scope.$apply(function() {
                                line = $compile('<c6-line disableprev="false" annotation="annotation"></c6-line>')($scope);
                            });
                        });
                        it('should show prev button', function() {
                            expect(line.find('button.tts__prev-arrow').hasClass('ng-hide')).toBe(false);
                        });
                    });
                });

                describe('disablenext', function() {
                    describe('when true', function() {
                        var line;
                        beforeEach(function() {
                            $scope.$apply(function() {
                                line = $compile('<c6-line disablenext="true" annotation="annotation"></c6-line>')($scope);
                            });
                        });

                        it('should hide prev button', function() {
                            expect(line.find('button.tts__next-arrow').hasClass('ng-hide')).toBe(true);
                        });
                    });
                    describe('when false', function() {
                        var line;
                        beforeEach(function() {
                            $scope.$apply(function() {
                                line = $compile('<c6-line disablenext="false" annotation="annotation"></c6-line>')($scope);
                            });
                        });
                        it('should show prev button', function() {
                            expect(line.find('button.tts__next-arrow').hasClass('ng-hide')).toBe(false);
                        });
                    });
                });

                xdescribe('errorMessage', function() {
                    var line,
                        scope;
                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Hey!',
                            duration: 2,
                            maxChars: 15,
                            isValid: function() {}
                        };
                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });
                        scope = line.children().scope();
                    });

                    describe('when mp3 is too long', function() {
                        beforeEach(function() {
                            spyOn(scope.annotation, 'isValid').andReturn(false);
                            scope.$apply(function() {
                                scope.valid = false;
                            });
                        });

                        it('should set errorMessage to Dialogue too long!...', function() {
                            expect(scope.errorMessage).toBe('Dialogue too long! Max time is 2 seconds')
                        });
                    });

                    describe('when there are remaining characters', function() {
                        beforeEach(function() {
                            spyOn(scope.annotation, 'isValid').andReturn(true);
                        });

                        it('should set errorMessage to xx Characters remaining', function() {
                            expect(scope.errorMessage).toBe('11 Characters Remaining');
                        });
                    });

                    describe('when max characters has been reached', function() {
                        beforeEach(function() {
                            spyOn(scope.annotation, 'isValid').andReturn(true);
                            scope.$apply(function() {
                                scope.annotation.text = 'This is 15 char';
                            });
                        });
                        it('should set errorMessage to "No more space!..."', function() {
                            expect(scope.errorMessage).toBe('No more space! Max characters: 15');
                        });
                    });
                });

                xdescribe('isSavable', function() {
                    var line,
                        scope;
                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Hey!',
                            isValid: function() {}
                        };
                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });
                        scope = line.children().scope();
                    });

                    describe('when there is no text', function() {
                        beforeEach(function() {
                            spyOn(scope.annotation, 'isValid').andReturn(true);
                            scope.$apply(function() {
                                scope.annotation.text = '';
                            });
                        });
                        it('should be unsavable', function() {
                            expect(scope.isSavable).toBe(false);
                        });
                    });

                    describe('when there is text and the mp3 is valid', function() {
                        beforeEach(function() {
                            spyOn(scope.annotation, 'isValid').andReturn(true);
                            scope.$digest();
                        });
                        it('should be savable', function() {
                            expect(scope.isSavable).toBe(true);
                        });
                    });

                    describe('when the mp3 is not valid', function() {
                        beforeEach(function() {
                            spyOn(scope.annotation, 'isValid').andReturn(false);
                            scope.$digest();
                        });
                        it('should not be savable', function() {
                            expect(scope.isSavable).toBe(false);
                        });
                    });
                });

                describe('isListenable', function() {
                    var line,
                        scope;
                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Hey!',
                            isValid: function() {}
                        };
                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });
                        scope = line.children().scope();
                    });

                    describe('when there is no text', function() {
                        beforeEach(function() {
                            scope.$apply(function() {
                                scope.annotation.text = '';
                            });
                        });
                        it('should not be listenable', function() {
                            expect(scope.isListenable).toBe(false);
                        });
                    });

                    describe('when there is text and the mp3 is fetched', function() {
                        it('should be listenable', function() {
                            expect(scope.isListenable).toBe(true);
                        });
                    });

                    describe('when the mp3 is fetching', function() {
                        beforeEach(function() {
                            scope.$apply(function() {
                                scope.fetching = true;
                            });
                        });
                        it('should not be listenable', function() {
                            expect(scope.isListenable).toBe(false);
                        });
                    });
                });

                xdescribe('isEmpty', function() {
                    var line,
                        scope;
                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Hey!',
                            isValid: function() {}
                        };
                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });
                        scope = line.children().scope();
                    });

                    describe('when there is no text', function() {
                        beforeEach(function() {
                            scope.$apply(function() {
                                scope.annotation.text = '';
                            });
                        });
                        it('should be empty', function() {
                            expect(scope.isEmpty).toBe(true);
                        });
                    });

                    describe('when there is text', function() {
                        it('should not be empty', function() {
                            expect(scope.isEmpty).toBe(false);
                        });
                    });
                });
            });
        });
    });
}());
