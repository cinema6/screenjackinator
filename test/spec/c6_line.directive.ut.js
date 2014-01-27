(function() {
    'use strict';

    define(['screenjack_player'], function() {
        describe('<c6-line></c6-line>', function() {
            var $rootScope,
                $scope,
                $compile,
                $q;

            beforeEach(function() {
                module('c6.screenjackinator');

                inject(function($injector) {
                    $rootScope = $injector.get('$rootScope');
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
                        $scope.annotation = {};

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
                            isVirgin: function() {return true;}
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
                        expect(line.find('span').css('visibility')).toBe('visible');
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

                        $scope.annotation = {};

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
                        expect(line.find('span').css('visibility')).toBe('hidden');
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
                            getMP3: jasmine.createSpy('annotation.getMP3()')
                                .andCallFake(function() {
                                    return $scope.annotation._.getMP3Deferred.promise;
                                }),
                            speak: jasmine.createSpy('annotation.speak()'),
                            _: {
                                getMP3Deferred: $q.defer()
                            }
                        };

                        spyOn($scope.annotation, 'isVirgin').andCallThrough();

                        $scope.$apply(function() {
                            line = $compile('<c6-line annotation="annotation"></c6-line>')($scope);
                        });
                        $scope.$apply(function() {
                            scope = line.children().scope();
                            scope.editing = true;
                            scope.fetching = false;
                        });
                        $scope.$apply(function() {
                            $scope.annotation.text = 'My Edit';
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
                            expect(scope.invalid).toBe(false);
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
                                    expect(scope.invalid).toBe(false);
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
                                    expect(scope.invalid).toBe(true);
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

                        it('should disable the listen button', function() {
                            expect(listen.attr('disabled')).toBeDefined();
                        });

                        it('should show loading... indicator', function() {
                            expect(scope.fetching).toBe(true);
                        });

                        it('should get the MP3', function() {
                            expect($scope.annotation.getMP3).toHaveBeenCalled();
                        });

                        describe('after getting the MP3', function() {
                            beforeEach(function() {
                                $scope.$apply(function() {
                                    $scope.annotation._.getMP3Deferred.resolve($scope.annotation);
                                });
                            });

                            it('should hide loading... indicator', function() {
                                expect(scope.fetching).toBe(false);
                            });

                            describe('with valid MP3', function() {
                                beforeEach(function() {
                                    spyOn($scope.annotation, 'isValid').andReturn(true);

                                    listen = line.find('form button[name=listen]');
                                    listen.click();
                                });

                                it('should not add invalid css class to form element', function() {
                                    expect(scope.invalid).toBe(false);
                                });

                                it('should speak the line', function() {
                                    expect($scope.annotation.speak).toHaveBeenCalled();
                                });
                            });

                            describe('with invalid MP3', function() {
                                beforeEach(function() {
                                    spyOn($scope.annotation, 'isValid').andReturn(false);

                                    listen = line.find('form button[name=listen]');
                                    listen.click();
                                });

                                it('should add invalid css class to form element', function() {
                                    expect(scope.invalid).toBe(true);
                                });

                                it('should not speak the line', function() {
                                    expect($scope.annotation.speak).not.toHaveBeenCalled();
                                });
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
                            }
                        };

                        $scope.$apply(function() {
                            line = $compile('<c6-line show="\'true\'" annotation="annotation"></c6-line>')($scope);
                        });
                    });

                    it('should display the text', function() {
                        expect(line.find('span').text()).toBe('Hey!');
                    });

                    it('should bind the text to a textfield', function() {
                        expect(line.find('form input[type=text]').val()).toBe('Hey!');

                        $scope.$apply(function() {
                            $scope.annotation.text = 'Foo!';
                        });

                        expect(line.find('form input[type=text]').val()).toBe('Foo!');
                    });
                });
            });
        });
    });
}());
