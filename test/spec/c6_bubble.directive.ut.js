(function() {
    'use strict';

    define(['video'], function() {
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

            it('should give the bubble the "annotations__group" class', function() {
                var bubble;

                $scope.$apply(function() {
                    bubble = $compile('<c6-bubble></c6-bubble>')($scope);
                });

                expect(bubble.hasClass('annotations__group')).toBe(true);
            });

            it('should enter editing mode when clicked', function() {
                var bubble,
                    scope;

                $scope.$apply(function() {
                    bubble = $compile('<c6-bubble></c6-bubble>')($scope);
                });
                scope = bubble.scope();

                bubble.click();
                expect(scope.editing).toBe(true);
            });

            describe('attributes', function() {
                describe('show', function() {
                    var bubble;

                    beforeEach(function() {
                        $scope.showBubble = true;

                        bubble = $compile('<c6-bubble show="showBubble">Foo</c6-bubble>')($scope);
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
                });

                describe('when not editing', function() {
                    var bubble;

                    beforeEach(function() {
                        $scope.editing = false;

                        $scope.$apply(function() {
                            bubble = $compile('<c6-bubble></c6-bubble>')($scope);
                        });
                    });

                    it('should hide the form', function() {
                        expect(bubble.find('form').css('display')).toBe('none');
                    });

                    it('should show the text span', function() {
                        expect(bubble.find('span').css('display')).toBe('');
                    });
                });

                describe('when editing', function() {
                    var bubble;

                    beforeEach(function() {
                        $scope.$apply(function() {
                            bubble = $compile('<c6-bubble></c6-bubble>')($scope);
                        });
                        $scope.$apply(function() {
                            bubble.scope().editing = true;
                        });
                    });

                    it('should show the form', function() {
                        expect(bubble.find('form').css('display')).toBe('');
                    });

                    it('should hide the text span', function() {
                        expect(bubble.find('span').css('display')).toBe('none');
                    });
                });

                describe('after editing', function() {
                    var bubble,
                        scope;

                    beforeEach(function() {
                        $scope.annotation = {
                            text: 'Initial Text'
                        };

                        $scope.$apply(function() {
                            bubble = $compile('<c6-bubble annotation="annotation"></c6-bubble>')($scope);
                        });
                        $scope.$apply(function() {
                            scope = bubble.scope();
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
                    });

                    describe('clicking save', function() {
                        var save;

                        beforeEach(function() {
                            save = bubble.find('form button[name=save]');
                            save.click();
                        });

                        it('should keep the changes', function() {
                            expect($scope.annotation.text).toBe('My Edit');
                        });

                        it('should exit editing mode', function() {
                            expect(scope.editing).toBe(false);
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

                    it('should bind the annotations__group--{{style.modifier}} class to the bubble', function() {
                        expect(bubble.hasClass('annotations__group--antique')).toBe(true);

                        $scope.$apply(function() {
                            $scope.annotation.style.modifier = 'karate';
                        });

                        expect(bubble.hasClass('annotations__group--antique')).toBe(false);
                        expect(bubble.hasClass('annotations__group--karate')).toBe(true);
                    });

                    it('should add no modifier class if there is no modifier', function() {
                        $scope.$apply(function() {
                            delete $scope.annotation.style;
                        });

                        expect(bubble.attr('class').match(/annotations__group--[A-Za-z]*/)).toBe(null);
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
