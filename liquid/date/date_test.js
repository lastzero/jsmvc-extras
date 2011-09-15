/**
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2011 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */
 
steal('jquery')
.then('jquery/class')
.then('liquid/date')
.then('funcunit/qunit')
.then(function(){
    module('liquid/date');
    
    test('parseDateTimeString()', function(){
        expect(4);

        var date = Liquid.Date.parseDateTimeString('2011-01-22 19:34:00');
        equals(Math.floor(date.getTime() / 1000), 1298403240);

        date = Liquid.Date.parseDateTimeString('2011-01-22T19:34:00Z');
        equals(Math.floor(date.getTime() / 1000), 1298403240);

        date = Liquid.Date.parseDateTimeString('1950-01-22T19:34:00Z');
        equals(Math.floor(date.getTime() / 1000), -626588760);
        
        try {
            date = Liquid.Date.parseDateTimeString('2011-01-22Q19:34:00Z');
            ok(false, 'Invalid date string throws exception');
        } catch (e) {
            ok(true, 'Invalid date string throws exception');
        }
    });
    
    test('getInstance()', function() {
        var date = Liquid.Date.getInstance('2011-01-22 19:34:00');
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');
        
        try {
            date = Liquid.Date.getInstance('2011-01-2219:34:00');
            ok(false, 'Invalid dates throw an exception');
        } catch(e) {
            ok(true, 'Invalid dates throw an exception');
        }
        
        try {
            date = Liquid.Date.getInstance(new $.Class());
            ok(false, 'Invalid classes throw an exception');
        } catch(e) {
            ok(true, 'Invalid classes throw an exception');
        }
        
        date = Liquid.Date.getInstance(Liquid.Date.parseDateTimeString('2011-01-22T19:34:00Z'));
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');

        date = Liquid.Date.getInstance(Liquid.Date.getInstance('2011-01-22 19:34:00'));
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');
    });
    
    test('equals()', function () {
        var date = Liquid.Date.getInstance('2005-12-30 01:34:00');
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');
        ok(date.equals('2005-12-30 01:34:00'), 'Dates are equal');
        ok(!date.equals('2005-12-30 01:35:00'), 'Dates are different');
    });
    
    test('before()', function () {
        var date = Liquid.Date.getInstance('2005-12-30 01:34:00');
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');
        ok(date.before('2005-12-30 01:34:01'), 'Date is before');
        ok(!date.before('2005-12-30 01:34:00'), 'Dates are the same');
        ok(!date.before('2001-12-30 01:34:00'), 'Date is after');
    });
    
    test('after()', function () {
        var date = Liquid.Date.getInstance('2005-12-30 01:34:00');
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');
        ok(date.after('2005-12-30 01:33:59'), 'Date is after');
        ok(!date.after('2005-12-30 01:34:00'), 'Dates are the same');
        ok(!date.after('2009-12-30 01:34:01'), 'Date is before');
    });
    
    test('setDateTimeString()', function () {
        expect(5);
        var date = new Liquid.Date();
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');
        
        try {
            date.getUNIXTimestamp();
            ok(false, 'getUNIXTimestamp() throws an exception, because no time is set');
        } catch (e) {
            ok(true, 'getUNIXTimestamp() throws an exception, because no time is set');
        }
        
        date.setDateTimeString('2001-09-11 12:11:11');
        
        equals(date.getUNIXTimestamp(), 1002802271);
        
        try {
            date.setDateTimeString('2001-09-11 12:99:11');
            ok(false, 'setDateTimeString() throws an exception, because date is invalid');
        } catch (e) {
            ok(true, 'setDateTimeString() throws an exception, because date is invalid');
        }
        
        try {
            date.setDateTimeString('2001-00-11T12:00:11Z');
            ok(false, 'setDateTimeString() throws an exception, because date is invalid');
        } catch (e) {
            ok(true, 'setDateTimeString() throws an exception, because date is invalid');
        }
    });
    
    test('toLocaleString()', function () {
        var date = new Liquid.Date('1980-02-12 13:54:23');
        ok(date instanceof Liquid.Date, 'date is an instance of Liquid.Date');
        ok(date.toLocaleString() != '', 'String is returned');
    });
});
