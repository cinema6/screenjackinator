(function() {
    'use strict';

    define(['screenjack_player'], function() {
        describe('<c6-bubble></c6-bubble>', function() {
            var $compile,
                $rootScope,
                $scope;

            beforeEach(function() {
                module('c6.screenjackinator');

                inject(function($injector) {
                    $compile = $injector.get('$compile');
                    $rootScope = $injector.get('$rootScope');

                    $scope = $rootScope.$new();
                });
            });

            it('should give the bubble the "annotation__group" class', function() {
                var bubble;

                $scope.$apply(function() {
                    bubble = $compile('<c6-bubble></c6-bubble>')($scope);
                });

                expect(bubble.hasClass('annotation__group')).toBe(true);
            });

            describe('clicking', function() {
                var bubble,
                    scope;

                beforeEach(function() {
                    $scope.$apply(function() {
                        bubble = $compile('<c6-bubble editable="editable"></c6-bubble>')($scope);
                    });
                    scope = bubble.children().scope();
                });

                describe('if editable is true', function() {
                    beforeEach(function() {
                        $scope.$apply(function() {
                            $scope.editable = true;
                        });
                    });

                    it('should enter editing mode when clicked', function() {
                        bubble.click();
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
                        bubble.click();
                        expect(scope.editing).not.toBe(true);
                    });
                });
            });

            it('should not $emit c6Bubble:editdone on initialization', function() {
                var spy = jasmine.createSpy('c6Bubble:editdone');

                $scope.$on('c6Bubble:editdone', spy);
                $scope.$apply(function() {
                    $compile('<c6-bubble></c6-bubble>')($scope);
                });

                expect(spy).not.toHaveBeenCalled();
            });

            describe('attributes', function() {
                describe('show', function() {
                    var bubble,
                        showSpy,
                        hideSpy,
                        boundingBox;

                    beforeEach(function() {
                        boundingBox = {};

                        showSpy = jasmine.createSpy('bubble show');
                        hideSpy = jasmine.createSpy('bubble hide');

                        $scope.$on('c6Bubble:show', showSpy);
                        $scope.$on('c6Bubble:hide', hideSpy);

                        $scope.showBubble = true;
                        $scope.annotation = {};

                        $scope.$apply(function() {
                            bubble = $compile('<c6-bubble show="showBubble" annotation="annotation">Foo</c6-bubble>')($scope);
                            spyOn(bubble[0], 'getBoundingClientRect').andReturn(boundingBox);
                        });
                    });

                    it('should be shown when true', function() {
                        expect(bubble.css('display')).toBe('');
                    });

                    it('should be hidden when false', function() {
                        $scope.$apply(function() {
                            $scope.showBubble = false;
                        });

                        expect(bubble.css('display')).toBe('none');
                    });

                    it('should $emit c6Bubble:show when true', function() {
                        expect(showSpy).toHaveBeenCalled();

                        expect(showSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                        expect(showSpy.mostRecentCall.args[2]).toBe(boundingBox);
                    });

                    it('should $emit c6Bubble:hide when false', function() {
                        $scope.$apply(function() {
                            $scope.showBubble = false;
                        });

                        expect(hideSpy).toHaveBeenCalled();

                        expect(hideSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                        expect(hideSpy.mostRecentCall.args[2]).toBe(boundingBox);
                    });
                });

                describe('when not editing', function() {
                    var bubble,
                        editDoneSpy;

                    beforeEach(function() {
                        editDoneSpy = jasmine.createSpy('edit done');

                        $scope.editing = false;
                        $scope.annotation = {
                            isVirgin: function() {return true;}
                        };

                        $scope.$apply(function() {
                            bubble = $compile('<c6-bubble annotation="annotation"></c6-bubble>')($scope);
                        });

                        $scope.$apply(function() {
                            $scope.editing = false;
                        });

                        $scope.$on('c6Bubble:editdone', editDoneSpy);
                    });

                    it('should hide the form', function() {
                        expect(bubble.find('form').hasClass('ng-hide')).toBe(true);
                    });

                    it('should show the text span', function() {
                        expect(bubble.find('span').css('visibility')).toBe('visible');
                    });

                    it('should $emit c6Bubble:editdone when leaving edit mode', function() {
                        expect(editDoneSpy).not.toHaveBeenCalled();

                        $scope.$apply(function() {
                            bubble.children().scope().editing = true;
                        });
                        $scope.$apply(function() {
                            bubble.children().scope().editing = false;
                        });

                        expect(editDoneSpy).toHaveBeenCalled();
                        expect(editDoneSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                    });
                });

                describe('when editing', function() {
                    var bubble,
                        editStartSpy;

                    beforeEach(function() {
                        editStartSpy = jasmine.createSpy('edit start');

                        $scope.annotation = {};

                        $scope.$apply(function() {
                            bubble = $compile('<c6-bubble annotation="annotation"></c6-bubble>')($scope);
                        });
                        $scope.$on('c6Bubble:editstart', editStartSpy);
                        $scope.$apply(function() {
                            bubble.children().scope().editing = true;
                        });
                    });

                    it('should show the form', function() {
                        expect(bubble.find('form').css('display')).toBe('');
                    });

                    it('should hide the text span', function() {
                        expect(bubble.find('span').css('visibility')).toBe('hidden');
                    });

                    it('should $emit c6Bubble:editstart', function() {
                        expect(editStartSpy).toHaveBeenCalled();

                        expect(editStartSpy.mostRecentCall.args[1]).toBe($scope.annotation);
                    });
                });

                describe('after editing', function() {
                    var bubble,
                        scope;

                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Initial Text',
                            maxChars: 15,
                            isVirgin: function() {
                                return this.text === 'Initial Text';
                            },
                            isValid: function() {
                                return this.text.length <= this.maxChars;
                            }
                        };

                        $scope.modified = false;

                        $scope.invalid = false;

                        $scope.$apply(function() {
                            bubble = $compile('<c6-bubble annotation="annotation"></c6-bubble>')($scope);
                        });
                        $scope.$apply(function() {
                            scope = bubble.children().scope();
                            scope.editing = true;
                        });
                        $scope.$apply(function() {
                            $scope.annotation.text = 'My Edit';
                        });
                    });

                    describe('clicking cancel', function() {
                        var cancel;

                        beforeEach(function() {
                            cancel = bubble.find('form button[name=cancel]');
                            cancel.click();
                        });

                        it('should revert the annotation text back to its pre-editing value', function() {
                            expect($scope.annotation.text).toBe('Initial Text');
                        });

                        it('should exit editing mode', function() {
                            expect(scope.editing).toBe(false);
                        });

                        it('should not modify virginty', function() {
                            expect(scope.modified).toBe(false);
                        });
                    });

                    describe('clicking save', function() {
                        describe('with valid changes', function() {
                            var save;

                            beforeEach(function() {
                                spyOn($scope.annotation, 'isValid').andCallThrough();

                                save = bubble.find('form button[name=save]');
                                save.click();
                            });

                            it('should call isValid() and set scope.invalid to true', function() {
                                expect($scope.annotation.isValid).toHaveBeenCalled();
                                expect(scope.invalid).toBe(false);
                            });

                            it('should keep the changes', function() {
                                expect($scope.annotation.text).toBe('My Edit');
                            });

                            it('should exit editing mode', function() {
                                expect(scope.editing).toBe(false);
                            });

                            it('should modify virginity', function() {
                                expect(scope.modified).toBe(true);
                            });
                        });

                        describe('with invalid changes', function() {
                            var save;

                            beforeEach(function() {
                                $scope.$apply(function() {
                                    $scope.annotation.text = 'My Edit is too long to save';
                                    $scope.annotation.maxChars = 15;
                                });

                                spyOn($scope.annotation, 'isValid').andCallThrough();

                                save = bubble.find('form button[name=save]');
                                save.click();
                            });

                            it('should call isValid() and set scope.invalid to true', function() {
                                expect($scope.annotation.isValid).toHaveBeenCalled();
                                expect(scope.invalid).toBe(true);
                            });

                            it('should not exit editing mode', function() {
                                expect(scope.editing).toBe(true);
                            });

                            it('should not modifiy virginity', function() {
                                expect(scope.modified).toBe(false);
                            });
                        });
                    });
                });

                describe('annotation', function() {
                    var bubble;

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
                            bubble = $compile('<c6-bubble show="\'true\'" annotation="annotation"></c6-bubble>')($scope);
                        });
                    });

                    it('should display the text', function() {
                        expect(bubble.find('.annotations__text span').text()).toBe('Hey!');
                    });

                    it('should bind the text to a textfield', function() {
                        expect(bubble.find('form input[type=text]').val()).toBe('Hey!');

                        $scope.$apply(function() {
                            $scope.annotation.text = 'Foo!';
                        });

                        expect(bubble.find('form input[type=text]').val()).toBe('Foo!');
                    });

                    it('should bind the annotation__group--{{style.modifier}} class to the bubble', function() {
                        expect(bubble.hasClass('annotation__group--antique')).toBe(true);

                        $scope.$apply(function() {
                            $scope.annotation.style.modifier = 'karate';
                        });

                        expect(bubble.hasClass('annotation__group--antique')).toBe(false);
                        expect(bubble.hasClass('annotation__group--karate')).toBe(true);
                    });

                    it('should add no modifier class if there is no modifier', function() {
                        $scope.$apply(function() {
                            delete $scope.annotation.style;
                        });

                        expect(bubble.attr('class').match(/annotation__group--[A-Za-z]*/)).toBe(null);
                    });

                    it('should bind the position of the annotation to the proper CSS properties', function() {
                        function inlineStyles() {
                            var obj = {},
                                styleArray = bubble.attr('style').split(';');

                            styleArray.forEach(function(styleDef) {
                                var defArray = styleDef.split(': '),
                                    key = defArray[0].replace(/^ | $/g, ''),
                                    value = defArray[1] && defArray[1].replace(/^ | $/g, '');

                                if (key && value) {
                                    obj[key] = value;
                                }
                            });

                            return obj;
                        }

                        expect(inlineStyles().top).toBe('50%');
                        expect(inlineStyles().left).toBe('10%');

                        $scope.$apply(function() {
                            $scope.annotation.position.top = '20%';
                            $scope.annotation.position.left = '50%';
                        });

                        expect(inlineStyles().top).toBe('20%');
                        expect(inlineStyles().left).toBe('50%');
                    });
                });
            });
        });
    });
}());
