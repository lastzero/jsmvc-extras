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

$.Class.extend('Liquid.Ajax',
{ /* Prototype */
    rpcUrl: '/ajax', // Server base URL / controller name
    version: 1, // Protocol version that must match with the server

    debugMode: false, // Output debug messages
    developmentMode: false, // Verbose logs and no security checks
    useFixtures: false, // Use fixtures to simulate AJAX requests

    defaultSuccessEvent: '', // OpenAjax event string, in case no success callback is defined
    defaultErrorEvent: '', // OpenAjax event string, in case no error callback is defined

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
                logMessage = '[' + this.Class.fullName + '] ' + logMessage;
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
            dataType: 'json',
            fixture: this.useFixtures ? steal.root.path + '/fixtures/rpc/init.json' : false
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
        if(id && !isNaN(id)) {
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
        var successCallbackId = rpcRequest.success ? this.addAjaxCallback(rpcRequest.success) : this.defaultSuccessEvent;
        var errorCallbackId = rpcRequest.error ? this.addAjaxCallback(rpcRequest.error) : this.defaultErrorEvent;

        return successCallbackId + ':' + errorCallbackId + ':' + this.connectionNumber;
    },
    
    fixture: function(settings, callbackType) {
        var request = jQuery.evalJSON(settings.data);
        
        var params = jQuery.toJSON(request.params).replace(/[^a-zA-Z0-9]/g, '');
        
        if(params && params != 'null') {
            params = '/' + params;
        } else {
            params = '';
        }       
        
        var urlParts = settings.url.split('/');
        
        var service = urlParts[2].split('?');
        
        var filename = steal.root.path + '/fixtures/rpc/' + service[0] + '/' + request.method + params + '.json';
        
        var ids = request.id.split(':');
        
        $.getJSON(filename, {}, function (fixtureData) {
            if(!fixtureData) return;
            
            if(!fixtureData.error && settings.success && ids[0]) {
                settings.success({id: request.id, result: fixtureData.result, error: null});
            }

            if(fixtureData.error && settings.error && ids[1]) {
                settings.error({id: request.id, error: fixtureData.error, result: null});
            }
        });
    },

    rpc: function(request) { // Sends a JSON-RPC (Remote procedure call) request to the server
        if(this.isDisconnected()) {
            this.log('RPC call not possible, while disconnected - it will be added to the retry queue');
                
            this._ajaxQueue.push(request);

            return;
        }
        
        var data;
        var url;
        var aggregate = false;

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
            aggregate = true;
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
            data: jQuery.toJSON(data),
            success: this.callback('onAjaxSuccess'),
            error: this.callback('onAjaxError', request),
            dataType: 'json',
            processData: false,
            fixture: (this.useFixtures && !aggregate) ? this.fixture : false
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
    }
}
);
