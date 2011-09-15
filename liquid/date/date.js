/**
 * Liquid.Date is a utility class to parse and compare standard date formats (not locale specific)
 *
 * @class      Liquid.Date
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2011 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */

$.Class.extend('Liquid.Date', 
/* @Static */
{
    /*
     * Common date formats
     */
    regex: {
        dateISO: /([0-9]{4})-([0-9]{2})-([0-9]{2})/,
        dateEU: /([0-9]{2})\.([0-9]{2})\.([0-9]{4})/,
        dateUS: /([0-9]{2})\/([0-9]{2})\/([0-9]{4})/,
        mysql: /([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})/,
        iso8601: /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/
    },
    
    /*
     * Throws an exception if the given date can not be valid
     */
    checkDateTimeLimits: function (year, month, day, hour, minute, second) {
        if(year > 3000 || year < 1000) {
            throw 'Year is invalid: ' + year;
        }

        if(month > 12 || month < 1) {
            throw 'Month is invalid: ' + month;
        }
        
        if(day > 31 || day < 1) {
            throw 'Day is invalid: ' + day;
        }

        if(hour != undefined && (hour > 23 || hour < 0)) {
            throw 'Hour is invalid: ' + hour;
        }

        if(minute != undefined && (minute > 59 || minute < 0)) {
            throw 'Minute is invalid: ' + minute;
        }

        if(second != undefined && (second > 59 || second < 0)) {
            throw 'Second is invalid: ' + second;
        }
        
        return this;
    },
    
    /*
     * Returns a Date instance or throws an exception if string could not be parsed
     * @param {String} dateTimeString A date string in MySQL or ISO8601 format
     * @return {Date} A Date instance
     */
    parseDateTimeString: function (dateTimeString) {
        var dateComponents;
        var date = new Date(0);
        
        if(dateComponents = this.regex.mysql.exec(dateTimeString)) {
            this.checkDateTimeLimits(
                dateComponents[1], 
                dateComponents[2], 
                dateComponents[3],
                dateComponents[4],
                dateComponents[5],
                dateComponents[6]
            );

            date.setUTCFullYear(dateComponents[1]);
            date.setUTCMonth(dateComponents[2]);
            date.setUTCDate(dateComponents[3]);
            date.setUTCHours(dateComponents[4]);
            date.setUTCMinutes(dateComponents[5]);
            date.setUTCSeconds(dateComponents[6]);            
            
            return date;
        } else if (dateComponents = this.regex.iso8601.exec(dateTimeString)) {
            this.checkDateTimeLimits(
                dateComponents[1], 
                dateComponents[3], 
                dateComponents[5],
                dateComponents[7],
                dateComponents[9],
                dateComponents[11]
            );
            
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
            
            return date;
        } else if (dateComponents = this.regex.dateISO.exec(dateTimeString)) {
            console.log(dateComponents);
            this.checkDateTimeLimits(
                dateComponents[1], 
                dateComponents[2], 
                dateComponents[3]
            );

            date.setUTCFullYear(dateComponents[1]);
            date.setUTCMonth(dateComponents[2]);
            date.setUTCDate(dateComponents[3]);
            
            return date;
        } else if (dateComponents = this.regex.dateEU.exec(dateTimeString)) {
            this.checkDateTimeLimits(
                dateComponents[3], 
                dateComponents[2], 
                dateComponents[1]
            );

            date.setUTCFullYear(dateComponents[3]);
            date.setUTCMonth(dateComponents[2]);
            date.setUTCDate(dateComponents[1]);
            
            return date;
        } else if (dateComponents = this.regex.dateUS.exec(dateTimeString)) {
            this.checkDateTimeLimits(
                dateComponents[3], 
                dateComponents[1], 
                dateComponents[2]
            );

            date.setUTCFullYear(dateComponents[3]);
            date.setUTCMonth(dateComponents[1]);
            date.setUTCDate(dateComponents[2]);
            
            return date;
        }
        
        throw 'Not a valid datetime';
    },
    
    /*
     * @param {String} dateTimeString A string to be checked
     * @return {Boolean} True, if it's a valid datetime string
     */
    isValidDateTimeString: function (dateTimeString) {
        try {
            this.parseDateTimeString(data);
            return true;
        } catch(e) {
            return false;
        }
    },
    
    /*
     * @param {Date|String|Object} date Date instance, datetime string or Liquid.Date instance
     * @return {Object} An initialized instance of Liquid.Date
     */
    getInstance: function (date) {
        if(date && date instanceof Liquid.Date) {
            return date;
        }
        
        return new this(date);
    }
},
/* @Prototype */
{
    /*
     * Constructor
     * @param {Date|String} date Optional parameter for Date object or datetime string
     */
    setup: function (date) {
        if(date instanceof Date) {
            this.setDateInstance(date);
        } else if(date) {
            this.setDateInstance(this.Class.parseDateTimeString(date));
        }
    },
    
    /*
     * Accepts a date object to set the current date/time
     * @param {Date} date Instance of date
     */
    setDateInstance: function (date) {
        if(!date) {
            throw 'No date object given to setDateInstance()';
        }
        
        this.date = date;
        
        return this;
    },
    
    /*
     * Returns the currently set Date instance
     * @return {Date} The current Date instance
     */
    getDateInstance: function () {
        if(!this.date) {
            throw 'Date was not set in getDateInstance()';
        }
        
        return this.date;
    },
    
    /*
     * Sets a new Date instance
     * @return {Object} this (for chaining)
     */
    setDateTimeString: function (dateTimeString) {
        this.setDateInstance(this.Class.parseDateTimeString(dateTimeString));
        
        return this;
    },
    
    /*
     * Checks if date is equal to another date
     * @param {Date|String} Date object or datetime string
     * @return {Boolean} True, if dates are equal
     */
    equals: function (compareDate) {
        var timestamp1 = this.getUNIXTimestamp();
    
        try {
            var timestamp2 = this.Class.getInstance(compareDate).getUNIXTimestamp();
            return (timestamp1 == timestamp2);
        } catch (e) {
            return false;
        }
    },
    
    /*
     * Checks if date is earlier than another date
     * @param {Date|String} Date object or datetime string
     * @return {Boolean} True, if date is earlier
     */
    before: function (compareDate) {
        var timestamp1 = this.getUNIXTimestamp();
    
        try {
            var timestamp2 = this.Class.getInstance(compareDate).getUNIXTimestamp();
            return (timestamp1 < timestamp2);
        } catch (e) {
            return false;
        }
    },
    
    /*
     * Checks if date is later than another date
     * @param {Date|String} Date object or datetime string
     * @return {Boolean} True, if date is later
     */
    after: function (compareDate) {
        var timestamp1 = this.getUNIXTimestamp();
    
        try {
            var timestamp2 = this.Class.getInstance(compareDate).getUNIXTimestamp();
            return (timestamp1 > timestamp2);
        } catch (e) {
            return false;
        }
    },
    
    /*
     * @return {Integer} Returns the current date/time as UNIX timestamp (seconds since about 1970)
     */
    getUNIXTimestamp: function () {
        return(Math.floor(this.getDateInstance().getTime() / 1000));
    },
    
    /*
     * @return {String} Returns the current date/time as localized string (just a wrapper for Date right now)
     */
    toLocaleString: function () {
        return this.getDateInstance().toLocaleString;
    }
});
