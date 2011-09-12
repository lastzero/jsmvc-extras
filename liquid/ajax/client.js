/**
 * LICENSE
 *
 * This source file is subject to the new BSD license.
 * It is available through the world-wide-web at this URL:
 * http://www.liquidbytes.net/bsd.html
 *
 * @category   Liquid
 * @package    Liquid_Ajax
 * @copyright  Copyright (c) 2010 Liquid Bytes Technologies (http://www.liquidbytes.net/)
 * @license    http://www.liquidbytes.net/bsd.html New BSD License
 */

(function( $ ){
    window.Ajax = {
        rpcUrl: '/ajax', // Server base URL / controller name
        version: 1, // Protocol version that must match with the server

        debugMode: false, // Output debug messages
        developmentMode: false, // Verbose logs and no security checks

        config: {}, // Optional config object (sent by the server)
        secret: null, // CSRF Token
        
        connected: false,
        connectionHash: null,
        connectionNumber: 0, // Current window/tab number in session

        _ajaxCallbackCount: 0, // Callback counter (last callback id)
        _ajaxCallbacks: {}, // Assoc list of callbacks    
        _ajaxQueue: [],
        
        _events: {},

        init: function (options, events) { // Constructor
            $.extend(this, options); // Use optional options arg to extend this object
            
            if(events && typeof events == 'object') {
                for(var i in events) {
                   this.registerEvent(i, events[i]);                
                }
            }
            
            if(options.init) {
                this.onInitSuccess(options.init);
            } else {
                this.sendInitRequest();
            }
   
            this.triggerEvent('init', [options]);
        },
        
        triggerEvent: function (eventName, params) {
            if(this._events[eventName] && this._events[eventName] instanceof Array) {
                if(!params) {
                    params = [];
                }
                
                for(var i = 0; i < this._events[eventName].length; i++) {
                    if(typeof this._events[eventName][i] == 'function') {
                        this._events[eventName][i].apply(this, params);
                    } else if(typeof this._events[eventName][i] == 'string') {
                        OpenAjax.hub.publish(this._events[eventName][i], params);
                    }
                }
            }
        },

        registerEvent: function (eventName, callback) {        
            if(!this._events[eventName] || !this._events[eventName] instanceof Array) {
                this._events[eventName] = [];
            }
            
            this._events[eventName].push(callback);
        },

        log: function (logMessage) {
            if(this.debugMode) {
                if(typeof logMessage == 'string') {
                    logMessage = '[Liquid Ajax] ' + logMessage;
                }

                this.triggerEvent('log', arguments);
            }                
        },
        
        sendInitRequest: function () { // Get initial configuration and channel data from the server
            var url = this.rpcUrl + '/init';
            
            var data = { version: this.version, time: new Date().getTime() };
        
            $.ajax({
                type: 'GET',
                data: data,
                url: url,
                success: this.callback('onInitSuccess'),
                error: this.callback('onInitError'),
                dataType: 'json'
            });
            
            this.triggerEvent('sendInitRequest', [data, url]);
        },

        setDebugMode: function (flag) {
            // Use a setter, in case we want to create a debug console on mode change
            this.debugMode = (flag === true);

            if(this.debugMode) {
                this.log('Debug mode enabled');
            }
            
            this.triggerEvent('setDebugMode', [this.debugMode]);
        },

        setDevelopmentMode: function (flag) {
            // Use a setter, in case we want to take action on mode change
            this.developmentMode = (flag === true);

            if(this.developmentMode) {
                this.log('Development mode enabled');
            }

            this.triggerEvent('setDevelopmentMode', [this.developmentMode]);
        },

        setConfig: function (config) {
            // Extend this, if you expect the config in a different format or want to
            // process the object provided by the server
            this.config = config;
            
            this.triggerEvent('setConfig', [this.config]);
        },

        setSecret: function (secret) {
            // This is the CSRF Token (also used for the AJAX Push session broadcast channel name)
            this.secret = secret;
            
            this.triggerEvent('setSecret', [this.secret]);
        },
        
        isConnected: function () {
            return this.connected == true;
        },
        
        isDisconnected: function () {
            return this.connected == false;
        },
        
        onConnected: function () {
            this.connected = true;
            
            if(this._ajaxQueue) {
                // Retry, if calls were made while disconnected
                while(this._ajaxQueue.length > 0) {
                    this.rpc(this._ajaxQueue.shift());
                }
            }
            
            this.triggerEvent('onConnected', arguments);    
        },
        
        onDisconnected: function () {
            this.connected = false;
            this.triggerEvent('onDisconnected', arguments);
        },

        setConnectionHash: function (hash) {
            // The AJAX Push channel name
            this.connectionHash = hash;
            
            this.triggerEvent('setConnectionHash', [this.connectionHash]);
        },

        setConnectionNumber: function (number) {
            // This number increases with each init call and helps to address messages to the right browser window/tab
            this.connectionNumber = number;
            
            this.triggerEvent('setConnectionNumber', [this.connectionNumber]);
        },

        onInitSuccess: function (data) { // Success ajax response handler for sendInitRequest()
            if(data.version != this.version) {
                this.log('WARNING: Liquid Ajax Server version (' + data.version
                    + ') is different from client version (' + this.version
                    + ').');
            }

            this.setDebugMode(data.debugMode);
            this.setDevelopmentMode(data.developmentMode);

            this.setConfig(data.config);
            this.setSecret(data.secret);

            this.setConnectionHash(data.connectionHash);
            this.setConnectionNumber(data.connectionNumber);

            this.log('Initialization successful');
            
            this.triggerEvent('onInitSuccess', arguments);
            
            this.afterInitSuccess();
        },
        
        afterInitSuccess: function () {
            this.onConnected();
        },

        onInitError: function (data) { // Error ajax response handler for sendInitRequest()
            this.log('ERROR: Could not get initialization data from Liquid Ajax Server');
            
            this.triggerEvent('onInitError', arguments);
        },

        send: function (channel, message) {
            // Publishes an AJAX Push Message to other clients or just a local OpenAjax event, in case
            // AJAX Push is not available
            OpenAjax.hub.publish(channel, message);
            
            this.triggerEvent('send', arguments);
        },

        subscribe: function () {
            // Does work with Ajax Push connection only (use Liquid.Ajax.Orbited or Liquid.Ajax.Ape)
            this.triggerEvent('subscribe', arguments);
        },

        unsubscribe: function () {
            // Does work with Ajax Push connection only (use Liquid.Ajax.Orbited or Liquid.Ajax.Ape)
            this.triggerEvent('unsubscribe', arguments);
        },

        callAjaxCallback: function(id, data) {
            if(!id) {
                throw 'callAjaxCallback() requires an ID as first argument';
            }

            var entry = this._ajaxCallbacks[id];

            if(!entry) {
                this.log('ERROR: Callback entry for ID ' + id + ' not found');
                return;
            }

            if(!entry.callback) {
                this.log('ERROR: Callback function or event for ID ' + id + ' not found');
                return;
            }

            if(this.debugMode && entry.time) {
                var executionTime = new Date().getTime() - entry.time;
                this.log('Callback ID ' + id + ' is called after waiting for ' + executionTime + ' ms');
            }

            if(typeof entry.callback == 'string') {
                OpenAjax.hub.publish(entry.callback, data);
            } else {
                entry.callback(data);
            }
            
            this.triggerEvent('callAjaxCallback', arguments);
        },

        deleteAjaxCallback: function (id) {
            if(id) {
                delete this._ajaxCallbacks[id];
                this.triggerEvent('deleteAjaxCallback', arguments);
            }
        },

        addAjaxCallback: function(callback) {
            // Add callback function to internal list and return callback id
            // TODO: Dynamically limit the number of callbacks / Garbage Collection
            if(!callback) {
                return '';
            }

            if(typeof callback == 'string' && callback.indexOf('broadcast:') === 0) {
                return callback.substr(callback.indexOf(':') + 1);
            }

            this._ajaxCallbackCount++;

            this._ajaxCallbacks[this._ajaxCallbackCount] = {
                time: new Date().getTime(),
                callback: callback
            };
            
            this.triggerEvent('addAjaxCallback', [this._ajaxCallbackCount, callback]);

            return this._ajaxCallbackCount;
        },

        getAjaxCallbackId: function (rpcRequest) {
            return this.addAjaxCallback(rpcRequest.success) + ':' + this.addAjaxCallback(rpcRequest.error) + ':' + this.connectionNumber;
        },

        rpc: function(request) { // Sends a JSON-RPC (Remote procedure call) request to the server
            if(this.isDisconnected()) {
                this.log('RPC call not possible, while disconnected - it will be added to the retry queue');
                    
                this._ajaxQueue.push(request);

                return;
            }
            
            var data;
            var url;

            this.log('Sending RPC request: ', request);

            if(typeof request == 'object' && request instanceof Array) {
                data = [];
                for(var i = 0; i < request.length; i++) {
                    data.push({
                        service: request[i].service,
                        method: request[i].method,
                        params: request[i].params,
                        id: this.getAjaxCallbackId(request[i])
                    });
                }
                url = this.rpcUrl + '/aggregate';
            } else {
                data = {
                    method: request['method'],
                    params: request['params'],
                    id: this.getAjaxCallbackId(request)
                }

                url = this.rpcUrl + '/' + request['service'];
            };
            
            var ajaxRequest = {
                type: 'POST',
                url: url + '?t=' + encodeURIComponent(this.secret),
                data: $.toJSON(data),
                success: this.callback('onAjaxSuccess'),
                error: this.callback('onAjaxError', request),
                dataType: 'json',
                processData: false
            };

            var xhr = $.ajax(ajaxRequest);
            
            this.triggerEvent('rpc', [ajaxRequest, xhr]);
        },

        onAjaxSuccess: function (data) { // Default AJAX success handler for rpc() (see above)
            if(data && data.aggregated) { // Aggregated response
                for(var i = 0; i < data.aggregated.length; i++) {
                    this.publishRpcResponse(data.aggregated[i]);
                }

                if(data.messages) {
                    for(var i = 0; i < data.messages.length; i++) {
                        OpenAjax.hub.publish(data.messages[i].channel, data.messages[i].body);
                    }
                }
            } else if(data) { // Normal JSON-RPC response
                this.publishRpcResponse(data);
            }
            
            this.triggerEvent('onAjaxSuccess', arguments);
        },

        onAjaxError: function (request, xhr, options) { // Default AJAX error handler for rpc() (see above)
            if(xhr.status == 401) {
                this.onDisconnected();
                this._ajaxQueue.push(request);
                this.sendInitRequest();
            } else {
                this.log('WARNING: Got unexpected error from server: ', xhr);
            }
            
            this.triggerEvent('onAjaxError', [xhr, options]);
        },

        publishRpcResponse: function (response) { // This is called each time a JSON-RPC response is received from the server
            if(!response) {
                this.log('publishRpcResponse() received empty response');
                return; // Do nothing in this case, but log (in debug mode)
            }

            this.log('Got RPC response: ', response);

            var parts = response.id.split(':');

            if(response.error) {
                var callbackId = parts[1];
                var data = response.error;
                this.triggerEvent('onRpcError', [data]);
                this.deleteAjaxCallback(parts[0]);
            } else {
                var callbackId = parts[0];
                var data = response.result;
                this.triggerEvent('onRpcSuccess', [data]);
                this.deleteAjaxCallback(parts[1]);
            }

            if(isNaN(callbackId)) {
                OpenAjax.hub.publish(callbackId, data);
            } else {
                this.callAjaxCallback(callbackId, data);
            }

            this.deleteAjaxCallback(callbackId);
            
            this.triggerEvent('publishRpcResponse', arguments);
        },        
        
        // Stolen from JavaScriptMVC
        callback: function (funcs) {
            //args that should be curried
            var args = jQuery.makeArray(arguments),
                self;

            funcs = args.shift();

            if (!jQuery.isArray(funcs) ) {
                funcs = [funcs];
            }

            self = this;

            return function class_cb() {
                var cur = args.concat(jQuery.makeArray(arguments)),
                    isString, length = funcs.length,
                    f = 0,
                    func;

                for (; f < length; f++ ) {
                    func = funcs[f];
                    if (!func ) {
                        continue;
                    }

                    isString = typeof func == "string";
                    if ( isString && self._set_called ) {
                        self.called = func;
                    }
                    cur = (isString ? self[func] : func).apply(self, cur || []);
                    if ( f < length - 1 ) {
                        cur = !jQuery.isArray(cur) || cur._use_call ? [cur] : cur
                    }
                }
                return cur;
            }
        }
    };
    
    if(!$.toJSON) { // In case not loaded yet
        /*
        * jQuery JSON Plugin
        * version: 2.1 (2009-08-14)
        *
        * This document is licensed as free software under the terms of the
        * MIT License: http://www.opensource.org/licenses/mit-license.php
        *
        * Brantley Harris wrote this plugin. It is based somewhat on the JSON.org 
        * website's http://www.json.org/json2.js, which proclaims:
        * "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
        * I uphold.
        *
        * It is also influenced heavily by MochiKit's serializeJSON, which is 
        * copyrighted 2005 by Bob Ippolito.
        */
        /** jQuery.toJSON( json-serializble )
            Converts the given argument into a JSON respresentation.

            If an object has a "toJSON" function, that will be used to get the representation.
            Non-integer/string keys are skipped in the object, as are keys that point to a function.

            json-serializble:
                The *thing* to be converted.
         **/
        $.toJSON = function(o, replacer, space, recurse)
        {
            if (typeof(JSON) == 'object' && JSON.stringify)
                return JSON.stringify(o, replacer, space);

            if (!recurse && $.isFunction(replacer))
                o = replacer("", o);

            if (typeof space == "number")
                space = "          ".substring(0, space);
            space = (typeof space == "string") ? space.substring(0, 10) : "";
            
            var type = typeof(o);
        
            if (o === null)
                return "null";
        
            if (type == "undefined" || type == "function")
                return undefined;
            
            if (type == "number" || type == "boolean")
                return o + "";
        
            if (type == "string")
                return $.quoteString(o);
        
            if (type == 'object')
            {
                if (typeof o.toJSON == "function") 
                    return $.toJSON( o.toJSON(), replacer, space, true );
                
                if (o.constructor === Date)
                {
                    var month = o.getUTCMonth() + 1;
                    if (month < 10) month = '0' + month;

                    var day = o.getUTCDate();
                    if (day < 10) day = '0' + day;

                    var year = o.getUTCFullYear();
                    
                    var hours = o.getUTCHours();
                    if (hours < 10) hours = '0' + hours;
                    
                    var minutes = o.getUTCMinutes();
                    if (minutes < 10) minutes = '0' + minutes;
                    
                    var seconds = o.getUTCSeconds();
                    if (seconds < 10) seconds = '0' + seconds;
                    
                    var milli = o.getUTCMilliseconds();
                    if (milli < 100) milli = '0' + milli;
                    if (milli < 10) milli = '0' + milli;

                    return '"' + year + '-' + month + '-' + day + 'T' +
                                 hours + ':' + minutes + ':' + seconds + 
                                 '.' + milli + 'Z"'; 
                }

                var process = ($.isFunction(replacer)) ?
                    function (k, v) { return replacer(k, v); } :
                    function (k, v) { return v; },
                    nl = (space) ? "\n" : "",
                    sp = (space) ? " " : "";

                if (o.constructor === Array) 
                {
                    var ret = [];
                    for (var i = 0; i < o.length; i++)
                        ret.push(( $.toJSON( process(i, o[i]), replacer, space, true ) || "null" ).replace(/^/gm, space));

                    return "[" + nl + ret.join("," + nl) + nl + "]";
                }
            
                var pairs = [], proplist;
                if ($.isArray(replacer)) {
                    proplist = $.map(replacer, function (v) {
                        return (typeof v == "string" || typeof v == "number") ?
                            v + "" :
                            null;
                    });
                }
                for (var k in o) {
                    var name, val, type = typeof k;

                    if (proplist && $.inArray(k + "", proplist) == -1)
                        continue;

                    if (type == "number")
                        name = '"' + k + '"';
                    else if (type == "string")
                        name = $.quoteString(k);
                    else
                        continue;  //skip non-string or number keys
                
                    val = $.toJSON( process(k, o[k]), replacer, space, true );
                
                    if (typeof val == "undefined")
                        continue;  //skip pairs where the value is a function.
                
                    pairs.push((name + ":" + sp + val).replace(/^/gm, space));
                }

                return "{" + nl + pairs.join("," + nl) + nl + "}";
            }
        };

        /** jQuery.evalJSON(src)
            Evaluates a given piece of json source.
         **/
        $.evalJSON = function(src)
        {
            if (typeof(JSON) == 'object' && JSON.parse)
                return JSON.parse(src);
            return eval("(" + src + ")");
        };
        
        /** jQuery.secureEvalJSON(src)
            Evals JSON in a way that is *more* secure.
        **/
        $.secureEvalJSON = function(src)
        {
            if (typeof(JSON) == 'object' && JSON.parse)
                return JSON.parse(src);
            
            var filtered = src;
            filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
            filtered = filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
            filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
            
            if (/^[\],:{}\s]*$/.test(filtered))
                return eval("(" + src + ")");
            else
                throw new SyntaxError("Error parsing JSON, source is not valid.");
        };

        /** jQuery.quoteString(string)
            Returns a string-repr of a string, escaping quotes intelligently.  
            Mostly a support function for toJSON.
        
            Examples:
                >>> jQuery.quoteString("apple")
                "apple"
            
                >>> jQuery.quoteString('"Where are we going?", she asked.')
                "\"Where are we going?\", she asked."
         **/
        $.quoteString = function(string)
        {
            if (string.match(_escapeable))
            {
                return '"' + string.replace(_escapeable, function (a) 
                {
                    var c = _meta[a];
                    if (typeof c === 'string') return c;
                    c = a.charCodeAt();
                    return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
                }) + '"';
            }
            return '"' + string + '"';
        };
        
        var _escapeable = /["\\\x00-\x1f\x7f-\x9f]/g;
        
        var _meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };
    }
})( jQuery );
