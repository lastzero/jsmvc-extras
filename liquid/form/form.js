/**
 * Liquid.Form is a form class that should be used in JavaScriptMVC controllers 
 * as a layer between view and model. It validates forms based on easy-to-understand definitions
 *
 * There also is a PHP counterpart available (that uses the same definition format):
 * https://github.com/smashedpumpkin/liquidlibrary/blob/master/Liquid/Form.php
 *
 * ---------------------------------- Example ----------------------------------------
 * Liquid.Form.extend('Liquid.Form.Example', { _definition: {
 * {
 *   'name': {
 *      'caption': 'Name',
 *      'type': 'string',
 *      'min': 3,
 *      'max': 20,
 *      'default': 'John Anonymous'
 *   },      
 *   'email': {
 *      'caption': 'E-Mail',
 *      'type': 'email'
 *   }
 * }}, {});
 *
 * var errors = Liquid.Form.Example.getInstance({email: 'test@test.com'}).validate().getErrors();
 *
 * if(errors.length) {
 *   // Output errors       
 *   this.html(this.view('errors', {errors: errors});
 * } else {
 *   // Save data...
 * }
 * -----------------------------------------------------------------------------------
 *
 * @class      Liquid.Form
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2009-2011 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */

$.Class.extend('Liquid.Form', 
/* @Static */
{
    /*
     * Common date formats for date validation
     */
    dateRegex: {
        mysql: /([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})/,
        iso: /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/
    },

    /*
     * Assign form field definitions (overwrites existing definitions)
     * @param {Object} definition Contains the form field definitions
     */   
    setDefinition: function (definition) {
        this._definition = definition;

        return this;
    },
    
    /*
     * Add a form field definition (does not overwrite existing definition)
     * @param {String} key Field name
     * @param {Object} definition Field definition
     */   
    addDefinition: function (key, definition) {
        if(typeof this._definition[key] != 'undefined') {
            throw 'Definition for ' + key + ' already exists';
        }

        this._definition[key] = definition;
        
        return this;
    },
    
    /*
     * Update a form field definition (overwrites existing definition properties)
     * @param {String} key Field name
     * @param {Object} definition Updated field definition
     */   
    changeDefinition: function (key, changes) {
        if(typeof this._definition[key] == 'undefined') {
            throw 'Definition for ' + key + ' does not exist';
        }

        for(var prop in changes) {
            if(changes[prop] == null) {
                unset(this._definition[key][prop]);
            } else {
                this._definition[key][prop] = changes[prop];
            }
        }
        
        return this;
    },
    
    /*
     * Returns all form field definitions
     */   
    getDefinition: function () {
        return $.extend(true, {}, this._definition); // Make sure to clone the definition object!
    },
    
    /*
     * Returns an instance of the current 
     * @param {Object} data Field values (optional; overwrites default from form field definition)
     */   
    getInstance: function (data) {
        return new this (data);
    },
    
    /**
    * @attribute _definition
    * Containt the definition of the form and needs to be set by derived classes or via setDefinition().
    * It's no problem to store this in the static part, since our classes support static inheritance.
    */
    _definition: {},
    
    _getFieldCaption: function (fieldDefinition) {
        return fieldDefinition.caption == undefined ? 'The field' : fieldDefinition.caption;
    },
        
    _renderValidationError: function (fieldDefinition, errorType) {
        var result = {};

        var text = $.View('//liquid/form/errors/' + errorType + '.ejs', 
            {
                rules: fieldDefinition, // Definition of current field
                form: this.getDefinition(), // Complete form definition, not just the field
                caption: this._getFieldCaption(fieldDefinition) // Get caption as string
            }
        );
        
        result[errorType] = $.trim(text); // Trim new lines/spaces/tabs from error message

        return result;
    },
    
    /*
     * Validates a string
     */
    _stringValidator: function (data, def, form) {
        var result = [];
        
        if(typeof data != 'string') {
            result.push(this._renderValidationError(def, 'no_string'));
            return result;
        }
        
        if(def.min != undefined && data.length < def.min) {
            result.push(this._renderValidationError(def, 'string_too_short'));
        }
        
        if(def.max != undefined && data.length > def.max) {
            result.push(this._renderValidationError(def, 'string_too_long'));
        }
        
        if(def.matches != undefined && data != form.getValue(def.matches)) {
            result.push(this._renderValidationError(def, 'no_match'));
        }
        
        if(def.regex != undefined) {
            if(!def.regex.test(data)) {
                result.push(this._renderValidationError(def, 'invalid'));
            }
        }

        return result;
    },
    
    /*
     * Validates a boolean value (true/false)
     */
    _boolValidator: function (data, def, form) {
        var result = [];
        
        if(typeof data != 'boolean') {
            result.push(this._renderValidationError(def, 'no_boolean'));
            return result;
        }
        
        return result;
    },
    
    /*
     * Validates an integer value
     */
    _intValidator: function (data, def, form) {
        var result = [];
        
        if(isNaN(data) || parseInt(data) != data) {
            result.push(this._renderValidationError(def, 'no_integer'));
            return result;
        }
        
        if(def.min != undefined && data < def.min) {
            result.push(this._renderValidationError(def, 'integer_too_small'));
        }
        
        if(def.max != undefined && data > def.max) {
            result.push(this._renderValidationError(def, 'integer_too_big'));
        }
        
        if(def.matches != undefined && data != form.getValue(def.matches)) {
            result.push(this._renderValidationError(def, 'no_match'));
        }

        return result;
    },
    
    /*
     * Validates any numeric value
     */
    _numericValidator: function (data, def, form) {
        var result = [];
        
        if(isNaN(data) || parseFloat(data) != data) {
            result.push(this._renderValidationError(def, 'no_number'));
            return result;
        }
        
        if(def.min != undefined && data < def.min) {
            result.push(this._renderValidationError(def, 'number_too_small'));
        }
        
        if(def.max != undefined && data > def.max) {
            result.push(this._renderValidationError(def, 'number_too_big'));
        }
        
        if(def.matches != undefined && data != form.getValue(def.matches)) {
            result.push(this._renderValidationError(def, 'no_match'));
        }

        return result;
    },
    
    /*
     * Validates a scalar value
     */
    _scalarValidator: function (data, def, form) {
        if(typeof data == 'string') {
            return this._stringValidator(data, def, form);
        } else if(typeof data == 'number') {
            return this._numericValidator(data, def, form);
        } else if(typeof data == 'boolean') {
            return this._boolValidator(data, def, form);
        } 
        
        var result = [];        
        
        result.push(this._renderValidationError(def, 'no_scalar'));
        
        return result;
    },
    
    /*
     * Validates a list (object in JS, array in PHP)
     */
    _listValidator: function (data, def, form) {
        var result = [];

        if(typeof data != 'object') {
            result.push(this._renderValidationError(def, 'no_list'));
        }
        
        return result;
    },
    
    /*
     * Validates a date in Mysql or ISO format
     */
    _dateValidator: function (data, def, form) {
        var result = [];

        var dateComponents; // = mysqlDateFormat.exec(data);
        var date = new Date();
        
        if(dateComponents = this.dateRegex.mysql.exec(data)) {            
            date.setUTCFullYear(dateComponents[1]);
            date.setUTCMonth(dateComponents[2]);
            date.setUTCDate(dateComponents[3]);
            date.setUTCHours(dateComponents[4]);
            date.setUTCMinutes(dateComponents[5]);
            date.setUTCSeconds(dateComponents[6]);            
            
            // TODO: Check min/max/match
        } else if (dateComponents = this.dateRegex.iso.exec(data)) {
            date.setUTCFullYear(dateComponents[1]);
            date.setUTCMonth(dateComponents[3]);
            date.setUTCDate(dateComponents[5]);
            date.setUTCHours(dateComponents[7]);
            date.setUTCMinutes(dateComponents[9]);
            date.setUTCSeconds(dateComponents[11]); 
            
            if (dateComponents[12]) {
                date.setUTCMilliseconds(parseFloat(dateComponents[12]) * 1000);
            } else {
                date.setUTCMilliseconds(0);
            }
            
            if (dateComponents[13] != 'Z') {
                var offset = (dateComponents[15] * 60) + parseInt(dateComponents[17], 10);
                offset *= ((dateComponents[14] == '-') ? -1 : 1);
                date.setTime(date.getTime() - offset * 60 * 1000);
            }
            
            // TODO: Check min/max/match   
        } else {
            result.push(this._renderValidationError(def, 'no_date'));
        }
        
        return result;
    },
        
    /*
     * Validates an email address
     */
    _emailValidator: function (data, def, form) {
        def['regex'] = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        
        return this._stringValidator(data, def, form);
    }
},
/* @Prototype */
{
    /*
     * Is true, after validate() was called and false after data was changed
     */
    _validationDone: false,
    
    /*
     * Constructor (initializes internal state)
     */
    setup: function (values) {
        this.clearModels();
        this.clearErrors();
        this.clearValues(values);        
    },
    
    /*
     * Returns the form definition data AND the corresponding values all in one object
     * This can be useful to send form data to the server or for rendering HTML
     */
    getForm: function () {
        var result = {};

        for(var key in this.Class._definition) {
            result[key] = this.Class._definition[key];
            result[key]['value'] = this.getValue(key);
        }

        return result;
    },
    
    /*
     * Returns the form definition or a subset (in case key and propertyName are provided)
     * @param {String} key Optional field name
     * @param {String} propertyName Optional property name
     */
    getDefinition: function (key, propertyName) {
        if(propertyName) {
            var field = this.getDefinition(key);
            if(field[propertyName]) {
                return field[propertyName];
            } else {
                return null;
            }
        } else if(key) {
            if(this.Class._definition[key]) {
                return this.Class._definition[key];
            }
            
            throw 'No form field definition found for ' + key;
        }
        
        return this.Class._definition;
    },
    
    /*
     * Sets form field value and resets validation flag
     * @param {String} key Field name
     * @param {String} value Field value
     */
    setValue: function (key, value) {
        if(this.Class._definition[key] != undefined) {
            this.clearErrors();
            this._values[key] = value;
            return this;
        }

        throw key + ' is not defined in form';
    },
    
    /*
     * Returns form field value and throws an exception, if field is not defined in form
     * @param {String} key Field name
     */
    getValue: function (key) {
        if(this.Class._definition[key] != undefined) {
            try {
                return this._values[key];
            } catch (e) {
                throw 'Form field not defined: ' + key;
            }
        }
        
        throw key + ' is not defined in form';
    },
    
    /*
     * Assigns all values to the form and throws an exception, if a form field is not defined
     * @param {Object} values The values to be stored
     */
    setAllValues: function (values) {
        for(var key in values) {
            this.setValue(key, values[key]);
        }

        return this;
    },
    
    /*
     * Tries to get all form field values from "values" and throws an exception is something is missing
     * @param {Object} values The values to be stored
     */
    setDefinedValues: function (values) {
        for(var key in this.Class._definition) {
            this._setCheckboxValueInObject(key, values);
            
            if(typeof values[key] === 'undefined') {
                throw 'Object provided to setDefinedValues() was not complete: ' + key;
            }
            
            this.setValue(key, values[key]);
        }        
        
        return this;
    },
    
    /*
     * Assigns all user writable values to the form and throws an exception, if a form field is not defined
     * @param {Object} values The values to be stored
     */
    setWritableValues: function (values) {
        for(var key in values) {
            if(this._isWritable(key)) {
                this.setValue(key, values[key]);
            }
        }

        return this;
    },
    
    /*
     * Combination of setDefinedValues and setWritableValues
     * @param {Object} values The values to be stored
     */
    setDefinedWritableValues: function (values) {
        for(var key in this.Class._definition) {
            if(this._isWritable(key)) {
                this._setCheckboxValueInObject(key, values);
                
                if(typeof values[key] === 'undefined') {
                    throw 'Object provided to setDefinedWritableValues() was not complete: ' + key;
                }
                
                this.setValue(key, values[key]);
            }
        }        
        
        return this;
    },
    
    /*
     * Only assigns values on the given page number
     * @param {Object} values The values to be stored
     * @param {Integer} page Page number
     */
    setDefinedWritableValuesOnPage: function (values, page) {
        for(var key in this.Class._definition) {
            if(this.Class._definition[key] 
                    && this.Class._definition[key]['page'] 
                    && this.Class._definition[key]['page'] == page 
                    && this._isWritable(key)) {
                this._setCheckboxValueInObject(key, values);

                if(typeof values[key] == 'undefined') {
                    throw 'Object provided to setWritableValuesOnPage() was not complete: ' + key;
                }

                this.setValue(key, values[key]);
            }
        }

        return this;
    },
    
    /*
     * Assigns form field values from the given HTML element
     * @param {Object} el The form (as jQuery object)
     */
    setValuesFromHtml: function (el) {
        var data = el.serializeArray();
        
        for(var i = 0; i < data.length; i++) {
            if(this.Class._definition[data[i].name] != undefined) {
                this.setValue(data[i].name, data[i].value);
            }
        }
        
        return this;
    },


    /*
     * Returns all values by page
     */
    getValuesByPage: function () {
        var result = {};
        var page;

        for(var key in this.Class._definition) {
            page = this.getDefinition(key, 'page');

            if(page) {
                if(typeof result[page] == 'undefined') {
                    result[page] = {};
                }
                
                result[page][key] = this.getValue(key);
            }
        }

        return result;
    },
    
    /*
     * Returns all form field values (but not the form field definitions - use getForm() for that)
     */
    getValues: function () {
        var result = {};

        for(var key in this.Class._definition) {
            result[key] = this.getValue(key);
        }

        return result;
    },
    
    /*
     * True, if the validation detected any errors (run validate() first!)
     */
    hasErrors: function () {
        if(!this._validationDone) {
            throw 'You must run validate() before calling hasErrors()';
        }
        
        return (this._errors.length > 0);
    },
    
    /*
     * Returns all validation errors (run validate() first!)
     */
    getErrors: function () {
        if(!this._validationDone) {
            throw 'You must run validate() before calling getErrors()';
        }
        
        return this._errors;
    },
    
    /*
     * Returns validation errors in a flat object (only one error for each field)
     */
    getSimpleErrors: function () {
        var result = {};
        var errors = this.getErrors();

        for(var i = 0; i < errors.length; i++) {
            var firstError = errors[i]['errors'][0];
            
            for(var j in firstError) {
                result[errors[i]['name']] = firstError[j];
                break;
            }
        }
        
        return result;
    },
    
    /*
     * Returns all validation errors split up by page number
     */
    getErrorsByPage: function () {
        var result = {};
        var errors = this.getErrors();
        var page;
        
        for(var i = 0; i < errors.length; i++) {
            page = this.getDefinition(errors[i]['name'], 'page');

            if(page) {
                if(typeof result[page] == 'undefined') {
                    result[page] = {};
                }
                
                result[page][errors[i]['name']] = errors[i]['errors'];
            }
        }

        return result;
    },
    
    /*
     * Deletes all existing model instances
     */
    clearModels: function () {
        this._modelInstances = {};
        
        return this;
    },
    
    /*
     * Resets all form field values to default
     * @param {Object} defaults Additional default values (not contained in form definition)
     */
    clearValues: function (defaults) {
        this._values = {};
        
        for(var key in this.Class._definition) {
            if(!defaults || defaults[key] == undefined) {
                if(typeof this.Class._definition[key]['default'] != 'undefined') {
                    this._values[key] = this.Class._definition[key]['default'];
                } else {
                    this._values[key] = null; // Null, not undefined
                }
            } else {
                this._values[key] = defaults[key];
            }
        }
        
        return this;
    },

    /*
     * Resets validation errors
     */
    clearErrors: function () {
        this._validationDone = false;
        this._errors = [];

        return this;
    },
    
    /*
     * Validates the form field values (use getErrors(), getSimpleErrors() or getErrorsByPage() to get them)
     * @param {Object} callback Optional callback function to perform validation
     */
    validate: function (callback) {
        if(callback) {
            callback(this);
        }
        
        this._validate();
        
        return this;
    },
    
    /*
     * Assigns models to the form and tries to initialize form field values from their data
     * @param {Array} models A list of models (type will be detected automatically)
     */
    setModels: function (models) {
        if(!$.isArray(models)) models = [models];
        
        for(var i = 0; i < models.length; i++) {
            this._modelInstances[models[i].Class.fullName] = models[i];
        }
        
        for(var key in this.Class._definition) {
            var instance = this._modelInstances[this.Class._definition[key].model.fullName];
            
            if(instance != undefined && instance[key] != undefined) {
                this.setValue(key, instance[key]);
            }            
        }
        
        return this;
    },
    
    /*
     * Returns models (updated with the current form field values)
     */
    getModels: function () {
        var modelData = {};
        var models = {};
        
        for(var key in this.Class._definition) {
            var model = this.Class._definition[key].model;
            
            if(model != undefined) {
                if(modelData[model.fullName] == undefined) {
                    modelData[model.fullName] = {};
                    models[model.fullName] = model;
                }
                
                if(this._values[key] != undefined) {
                    modelData[model.fullName][key] = this.getValue(key);
                }
            }            
        }
        
        for(var className in modelData) {
            if(this._modelInstances[className] != undefined) {
                if(typeof this._modelInstances[className]['fromForm'] == 'function') {
                    this._modelInstances[className].fromForm(modelData[className]);
                } else {
                    this._modelInstances[className].attrs(modelData[className]);
                }
            } else if(typeof models[className]['fromForm'] == 'function') {
                this._modelInstances[className] = models[className].fromForm(modelData[className]);
            } else {
                this._modelInstances[className] = new models[className](modelData[className]);
            }
        }
        
        return this._modelInstances;
    },
    
    /*
     * Helper function to set checkbox fields to an acceptable default value
     * @param {String} key The field name (must be defined in the form definition)
     * @param {Object} values Input values (raw form data in key/value format)
     */
    _setCheckboxValueInObject: function (key, values) {
        if(this._isCheckbox(key) && typeof values[key] === 'undefined') {
            var type = this.getDefinition(key, 'type');
            switch(type) {
                case 'array':
                    values[key] = array();
                    break;
                case 'bool':
                    values[key] = false;
                    break;
                default:
                    values[key] = null;
            }
        }
    },
    
    /*
     * Returns true, if key is read only (private function)
     * @param {String} key The field name (must be defined in the form definition)
     */
    _isWritable: function (key) {
        return this.getDefinition(key, 'readonly') != true;
    },
    
    /*
     * Returns true, if key is a checkbox field (private function)
     * @param {String} key The field name (must be defined in the form definition)
     */
    _isCheckbox: function (key) {
        return this.getDefinition(key, 'checkbox') == true;
    },
    
    /*
     * Used by the default validation function to validate a form field (private function)
     * @param {String} key The field name (must be defined in the form definition)
     */
    _validateField: function (key) {
        if(!this.Class._definition[key].type) {
            throw 'No type set for field ' + key;
        }

        if(!this.Class['_' + this.Class._definition[key].type + 'Validator']) {
            throw 'No validator for type ' + this.Class._definition[key].type;
        }
        
        return this.Class['_' + this.Class._definition[key].type + 'Validator'](
            this._values[key],
            this.Class._definition[key],
            this
        );
    },
    
    /*
     * Default validation function (private function)
     */
    _validate: function () {
        if(this._validationDone) {
            throw 'Validation was already done. Call clearErrors() to reset';
        }
    
        for(var key in this.Class._definition) {
            errors = this._validateField(key);

            if(errors && errors.length && errors.length > 0) {
                this._errors.push({
                    'name': key, 
                    'errors': errors
                });
            }
        }
        
        this._validationDone = true;
    }
});
