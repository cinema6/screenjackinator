(function() {
    'use strict';

    describe('the experiences', function() {
        var ptor = protractor.getInstance(),
            ExperiencePage = require('./pages/ExperiencePage.js')(ptor),
            experiencePage;

        describe('the Notebook experience', function() {
            beforeEach(function() {
                experiencePage = new ExperiencePage(0);
                experiencePage.get();
            });

            it('should include the necessary stylesheet', function() {
                var customStylesheet = element(by.className('custom-styles'));

                expect(customStylesheet.getAttribute('href').then(function(href) {
                    return !!href.match(/assets\/collateral\/styles\/antique\/antique\.css/);
                })).toBe(true);
            });

            it('should show the Notebook video', function() {
                expect(experiencePage.expVideo.getAttribute('src').then(function(src){
                    return !!src.match(/assets\/media\/not_over.mp4/);
                })).toBe(true);
            });

        });

        describe('the 2001 experience', function() {
            var nodes,
                c6lines,
                getAnnotation = function(id) {
                    var line = c6lines.get(id),
                        form = line.findElement(by.tagName('form')),
                        input = form.findElement(by.tagName('input')),
                        saveBtn = form.findElement(by.name('save'));

                    return {
                        line: line,
                        form: form,
                        input: input,
                        saveBtn: saveBtn
                    }
                };

            beforeEach(function() {
                experiencePage = new ExperiencePage(1);
                experiencePage.get();

                c6lines = element.all(by.tagName('c6-line'));
                nodes = element.all(by.repeater('node in state.nodes()'));
            });

            it('should get the 2001 video', function() {
                expect(experiencePage.expVideo.getAttribute('src').then(function(src){
                    return !!src.match(/assets\/media\/2001.mp4/);
                })).toBe(true);
            });

            it('should not be showing any of the annotations', function() {
                c6lines.each(function(elem) {
                    expect(elem.isDisplayed()).toBe(false);
                });
            });

            describe('clicking the nodes', function() {
                describe('clicking the first node', function() {
                    beforeEach(function() {
                        nodes.get(0).click();
                    });

                    it('should show the first annotation only', function() {
                        expect(c6lines.get(0).isDisplayed()).toBe(true);
                        expect(c6lines.get(1).isDisplayed()).toBe(false);
                        expect(c6lines.get(2).isDisplayed()).toBe(false);
                    });
                });

                describe('clicking the second node', function() {
                    beforeEach(function() {
                        nodes.get(1).click();
                    });

                    it('should show the second annotation only', function() {
                        expect(c6lines.get(0).isDisplayed()).toBe(false);
                        expect(c6lines.get(1).isDisplayed()).toBe(true);
                        expect(c6lines.get(2).isDisplayed()).toBe(false);
                    });
                });

                describe('clicking the third node', function() {
                    beforeEach(function() {
                        nodes.get(2).click();
                    });

                    it('should show the third annotation only', function() {
                        expect(c6lines.get(0).isDisplayed()).toBe(false);
                        expect(c6lines.get(1).isDisplayed()).toBe(false);
                        expect(c6lines.get(2).isDisplayed()).toBe(true);
                    });
                });
            });

            describe('clicking the annotations to edit', function() {
                describe('clicking the first annotation', function() {
                    var annotation;
                    beforeEach(function() {
                        annotation = getAnnotation(0);

                        nodes.get(0).click();
                        annotation.line.findElement(by.className('tts__box')).click();
                    });

                    it('should show the editing form', function() {
                        expect(annotation.form.isDisplayed()).toBe(true);
                    });

                    it('should have an initial value set', function() {
                        expect(annotation.input.getAttribute('value')).toBe('What\'s up?!');
                    });
                });

                describe('clicking the second annotation', function() {
                    var annotation;
                    beforeEach(function() {
                        annotation = getAnnotation(1);

                        nodes.get(1).click();
                        annotation.line.findElement(by.className('tts__box')).click();
                    });

                    it('should show the editing form', function() {
                        expect(annotation.form.isDisplayed()).toBe(true);
                    });

                    it('should have an initial value set', function() {
                        expect(annotation.input.getAttribute('value')).toBe('How are you?!');
                    });
                });

                describe('clicking the third annotation', function() {
                    var annotation;
                    beforeEach(function() {
                        annotation = getAnnotation(2);

                        nodes.get(2).click();
                        annotation.line.findElement(by.className('tts__box')).click();
                    });

                    it('should show the editing form', function() {
                        expect(annotation.form.isDisplayed()).toBe(true);
                    });

                    it('should have an initial value set', function() {
                        expect(annotation.input.getAttribute('value')).toBe('This is the final test.');
                    });
                });
            });

            describe('changing the annotation text', function() {
                describe('changing the first annotation', function() {
                    var annotation;

                    beforeEach(function() {
                        annotation = getAnnotation(0);

                        nodes.get(0).click();
                        annotation.line.findElement(by.className('tts__box')).click();
                    });

                    it('should change the input value', function() {
                        annotation.input.click();
                        annotation.input.sendKeys('Changing the text');
                        expect(annotation.input.getAttribute('value')).toBe('Changing the text');
                    });
                });
            });

            describe('saving the annotation', function() {
                var annotation;

                beforeEach(function() {
                    annotation = getAnnotation(0);
                    nodes.get(0).click();
                    annotation.line.findElement(by.className('tts__box')).click();
                    annotation.input.click();
                });

                describe('if text has not changed', function() {
                    beforeEach(function() {
                        annotation.saveBtn.click();
                    });

                    it('should hide the edit form', function() {
                        expect(annotation.form.isDisplayed()).toBe(false);
                    });

                    it('should still show the annotation', function() {
                        expect(annotation.line.isDisplayed()).toBe(true);
                    });

                    it('should show the initial text', function() {
                        expect(annotation.line.findElement(by.className('tts__text')).getText()).toBe('“What\'s up?!”');
                    });
                });

                xdescribe('if text has changed', function() {
                    beforeEach(function() {
                        annotation.input.sendKeys('Changing the text');
                        annotation.saveBtn.click();
                    });

                    it('should...', function() {

                    });
                });
            });

            describe('listening to the annotation', function() {

            });

            describe('canceling the annotation edit', function() {

            });
        });
    });
}());
