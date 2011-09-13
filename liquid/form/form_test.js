/**
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2011 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */
 
steal('jquery')
.then('jquery/class')
.then('jquery/model', 'jquery/view')
.then('jquery/view/ejs')
.then('liquid/form')
.then('liquid/form/test/model.js')
.then('liquid/form/test/form.js')
.then('funcunit/qunit')
.then(function(){
    module('liquid/form');
    
    test('validate()', function(){        
        var form = Liquid.Form.Test.Form.getInstance({name: 'Me'}).validate();

        ok(form.hasErrors(), 'Form has errors');

        var errors = form.getErrors();

        equals(errors.length, 7, 'All errors are returned');
        
        var def = form.getDefinition();
        
        for(var i = 0; i < errors.length; i++) {
            ok(errors[i]['name'], 'Error field name exists (' + i + ')');
            ok(errors[i]['errors'], 'Error list exists (' + i + ')');
            ok(def[errors[i]['name']], 'Field in error list contained in form definition (' + i + ')');
        }
        
        var errorsSimple = form.getSimpleErrors();
        
        for(var i in def) {
            ok(errorsSimple[i], 'Error message exists (' + i + ')');
        }
        
        var models = Liquid.Form.Test.Form.getInstance({name: 'Me'}).getModels();
        
        ok(models['Liquid.Form.Test.Model'], 'Example model is returned');
        
        form.setValue('smart', true);
        
        form.setValue('age', 23).validate();
        
        equals(form.getErrors().length, 5);

        form.setValue('debt', 49).validate();
        
        equals(form.getErrors().length, 4);
        
        form.setValue('debt', '99.1245').validate();
        
        equals(form.getErrors().length, 4);
        
        form.setValue('debt', '99x1245').validate();
        
        equals(form.getErrors().length, 5);
        
        form.setValue('age', 300).validate();
        
        equals(form.getErrors().length, 6);

        form.setValue('age', -5).validate();
        
        equals(form.getErrors().length, 6);
        
        form.setValue('age', 149).validate();
        
        equals(form.getErrors().length, 5);
    });
    
    test('General data assignment', function(){
        Liquid.Form.setDefinition(
            {
                'name': {
                    'caption': 'Name',
                    'type': 'string',
                    'min': 3,
                    'max': 20,
                    'default': 'John Anonymous'
                },
                
                'email': {
                    'caption': 'E-Mail',
                    'type': 'string',
                    'min': 3,
                    'max': 20,
                    'default': 'Something else'
                }
            }
        );
        
        var form = Liquid.Form.getInstance();
        
        equals(form.getValue('name'), 'John Anonymous');
        equals(form.getValue('email'), 'Something else');
        
        form.setValue('name', 'Me');

        equals(form.getValue('name'), 'Me');
        
        form.setDefinedValues({'name': 'You', 'email': 'foo@bar.com'});

        equals(form.getValue('name'), 'You');
        equals(form.getValue('email'), 'foo@bar.com');

        var htmlForm = $('<form><input type="text" name="name" value="Hello World" /></form>');
        
        form.setValuesFromHtml(htmlForm);
        
        equals(form.getValue('name'), 'Hello World');
        equals(form.getValue('email'), 'foo@bar.com');
    });
    
    test('setAllValues()', function(){
        expect(2);
        var form = new Liquid.Form.Test.Form();
        
        form.setAllValues({name: 'foo', email: 'test@test.com'});
        
        equals(form.getValue('name'), 'foo');
        equals(form.getValue('email'), 'test@test.com');
    });
    
    test('setWritableValues()', function(){
        expect(4);
        var form = new Liquid.Form.Test.Form();
        
        form.setWritableValues({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com',
            'password': 'srgertW9',
            'age': 65,
            'smart': true
        });
        
        equals(form.getValue('name'), 'foo');
        equals(form.getValue('email'), 'test@test.com');
        equals(form.getValue('password'), 'srgertW9');
        equals(form.getValue('debt'), null);
    });
    
    test('setDefinedValues()', function(){
        expect(4);
        
        var form = new Liquid.Form.Test.Form();
        
        form.setDefinedValues({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com',
            'password': 'srgertW9',
            'age': 65,
            'debt': 90000,
            'smart': true
        });
        
        equals(form.getValue('name'), 'foo');
        equals(form.getValue('email'), 'test@test.com');
        equals(form.getValue('password'), 'srgertW9');
        equals(form.getValue('debt'), 90000);
    });
    
    test('setDefinedWritableValues()', function(){
        expect(4);
        var form = new Liquid.Form.Test.Form();
        
        form.setDefinedWritableValues({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com',
            'password': 'srgertW9',
            'age': 65,
            'smart': true
        });
        
        equals(form.getValue('name'), 'foo');
        equals(form.getValue('email'), 'test@test.com');
        equals(form.getValue('password'), 'srgertW9');
        equals(form.getValue('debt'), null);
    });
    
    test('setDefinedWritableValuesOnPage()', function(){
        expect(3);
        var form = new Liquid.Form.Test.Form();
        
        form.setDefinedWritableValuesOnPage({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com'
        }, 1);
        
        equals(form.getValue('name'), 'foo');
        equals(form.getValue('email'), 'test@test.com');
        equals(form.getValue('email_again'), 'test@test.com');
    });
    
    test('setDefinition()', function(){
        expect(6);
        var form = Liquid.Form.setDefinition(Liquid.Form.Test.Form.getDefinition()).getInstance();
        
        form.setAllValues({name: 'foo', email: 'test@test.com'});
        
        equals(form.getValue('name'), 'foo');
        equals(form.getValue('email'), 'test@test.com');
        
        ok(form.validate().hasErrors(), 'Form has errors');

        Liquid.Form.setDefinition({
            'name': {
                'caption': 'Name',
                'type': 'string',
                'min': 3,
                'max': 20,
                'default': 'John Anonymous'
            },
            
            'email': {
                'caption': 'E-Mail',
                'type': 'string',
                'min': 3,
                'max': 20,
                'default': 'Something else'
            }
        });
        
        form.setAllValues({name: 'bar', email: 'test@test.com'});
        
        ok(!form.validate().hasErrors(), 'Form has no errors');
        
        equals(form.getValue('name'), 'bar');
        equals(form.getValue('email'), 'test@test.com');
    });
    
    test('addDefinition()', function () {
        expect(3);
        Liquid.Form.setDefinition(Liquid.Form.Test.Form.getDefinition());

        ok(typeof Liquid.Form._definition['add'] == 'undefined', 'Key is undefined');

        Liquid.Form.addDefinition('add', {
            'caption': 'Name',
            'type': 'string',
            'min': 3,
            'max': 20,
            'default': 'John Anonymous'
        });
        
        ok(typeof Liquid.Form._definition['add'] != 'undefined', 'Key is defined');       
        
        try {
            Liquid.Form.addDefinition('add', {
                'caption': 'Name',
                'type': 'string',
                'min': 3,
                'max': 20,
                'default': 'John Anonymous'
            });
            ok(false, 'Could not add the same definition twice');
        } catch (e) {
            ok(true, 'Could not add the same definition twice');
        }
    });
    
    test('changeDefinition()', function () {
        expect(3);
        var form = Liquid.Form.setDefinition(Liquid.Form.Test.Form.getDefinition()).getInstance();
        
        try {
            Liquid.Form.changeDefinition('add', {
                'caption': 'Name',
                'type': 'string',
                'min': 3,
                'max': 20,
                'default': 'John Anonymous'
            });
            ok(false, 'Could not change non-existing key');
        } catch (e) {
            ok(true, 'Could not change non-existing key');
        }
        
        equals(form.getDefinition('email', 'type'), 'email');

        Liquid.Form.changeDefinition('email', {
            'type': 'string'
        });
        
        equals(form.getDefinition('email', 'type'), 'string');
    });
    
    test('getForm()', function () {
        expect(24);
        
        var form = Liquid.Form.setDefinition(Liquid.Form.Test.Form.getDefinition()).getInstance();
        
        form.setValue('email', 'foo@bar.com');
        
        var formData = form.getForm();

        equals(formData['name']['value'], 'John Anonymous');
        equals(formData['email']['value'], 'foo@bar.com');
       
        form.setValue('email', 'something@bar.com');
        
        equals(formData['email']['value'], 'foo@bar.com');

        for(var key in formData) {
            ok(typeof formData[key]['caption'] != 'undefined', 'caption exists for ' + key);
            ok(typeof formData[key]['type'] != 'undefined', 'type exists for ' + key);
            ok(typeof formData[key]['value'] != 'undefined', 'value exists for ' + key);
        }
    });
    
    test('_isWritable()', function () {
        expect(2);
        
        var form = Liquid.Form.setDefinition(Liquid.Form.Test.Form.getDefinition()).getInstance();
        
        equals(form._isWritable('name'), true);
        equals(form._isWritable('debt'), false);
    });
    
    test('_isCheckbox()', function () {
        expect(2);
        
        var form = Liquid.Form.setDefinition(Liquid.Form.Test.Form.getDefinition()).getInstance();
        
        equals(form._isCheckbox('debt'), false);
        equals(form._isCheckbox('smart'), true);
    });
    
    test('getValuesByPage()', function(){
        expect(4);
        var form = new Liquid.Form.Test.Form();
        
        form.setDefinedWritableValues({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com',
            'password': 'srgertW9',
            'age': 65,
            'smart': false
        });
        
        var values = form.getValuesByPage();
        equals(values[1]['name'], 'foo');
        equals(values[2]['age'], 65);
        equals(values[2]['password'], 'srgertW9');
        equals(values[3]['smart'], false);
    });
    
    test('getErrorsByPage()', function(){
        expect(8);
        var form = new Liquid.Form.Test.Form();
        
        form.setDefinedWritableValues({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com',
            'password': 'srgertW9',
            'age': 65,
            'smart': false
        });

        try {
            form.getErrorsByPage();
            ok(false, 'Must validate before errors are available');
        } catch (e) {
            ok(true, 'Must validate before errors are available');
        }
        
        var errors = form.validate().getErrorsByPage();
        equals(typeof errors[0], 'undefined');
        equals(typeof errors[1], 'undefined');
        equals(typeof errors[2], 'undefined');
        equals(typeof errors[3], 'object');
        equals(typeof errors[3]['debt'][0]['no_number'], 'string');
        equals(typeof errors[4], 'undefined');
        equals(typeof errors[5], 'undefined');
    });
    
    test('getErrors()', function(){
        expect(5);
        var form = new Liquid.Form.Test.Form();
        
        form.setDefinedWritableValues({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com',
            'password': 'srgertW9',
            'age': 65,
            'smart': false
        });

        try {
            form.getErrors();
            ok(false, 'Must validate before errors are available');
        } catch (e) {
            ok(true, 'Must validate before errors are available');
        }
        
        var errors = form.validate().getErrors();
        equals(errors.length, 1);
        equals(errors[0]['name'], 'debt');
        equals(errors[0]['errors'].length, 1);
        equals(typeof errors[0]['errors'][0]['no_number'], 'string');
    });
    
    test('clearErrors()', function(){
        expect(3);
        var form = new Liquid.Form.Test.Form();
        
        form.setDefinedWritableValues({
            'name': 'foo', 
            'email': 'test@test.com',
            'email_again': 'test@test.com',
            'password': 'srgertW9',
            'age': 65,
            'smart': false
        });

        try {
            form.getErrors();
            ok(false, 'Must validate before errors are available');
        } catch (e) {
            ok(true, 'Must validate before errors are available');
        }
        
        var errors = form.validate().getErrors();
        equals(errors.length, 1);
        
        form.clearErrors();
        
        try {
            form.getErrors();
            ok(false, 'Must re-validate before errors are available');
        } catch (e) {
            ok(true, 'Must re-validate before errors are available');
        }
    });
    
    test('_dateValidator', function(){
        // expect(3);
        var form = Liquid.Form.setDefinition({
            'birthday': {
                'caption': 'Birthday',
                'type': 'date',
                'readonly': false,
                'page': 0
            }
        }).getInstance();
        
        form.setDefinedWritableValues({
            'birthday': '1981-02-23 13:25:01' // Valid (Mysql)
        });

        equals(form.validate().getErrors().length, 0);

        form.setValue('birthday', '2008-11-01T20:39:57.78-06:00'); // Valid (ISO)

        equals(form.validate().getErrors().length, 0);
        
        form.setValue('birthday', '1981-02-2313:25:01'); // Invalid
        
        equals(form.validate().getErrors().length, 1);
        
        form.setValue('birthday', '1981-02-23'); // Invalid
        
        equals(form.validate().getErrors().length, 1);
    });
});
