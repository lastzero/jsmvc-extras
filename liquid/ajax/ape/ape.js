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
 
steal('ape', 'liquid/ajax').then(function () {

Liquid.Ajax.extend('Liquid.Ajax.Ape', 
{ /* Prototype */
    subscriptions: {},
    
    subscriptionsComplete: false,
    
    connectionRetryTimeout: null,
    connectionRetryCounter: 0,
    
    pipes: {},
    
    apeConnected: false,    
    
    settings: {
        baseUrl: 'http://ape-test.local/js/ape', // APE_JSF
        domain: 'auto',
        server: 'ape-test.local:6969',
        host: 'ape'
    },
    
    init: function (options, events) {
        document.domain = document.domain;
        
        $.extend(this.settings, options);
        
        APE.Config.baseUrl = this.settings.baseUrl;
        APE.Config.domain = this.settings.domain; 
        APE.Config.server = this.settings.server;
        APE.Config.host = this.settings.host;

        this.configureApeScripts();
        
        this.client = new APE.Client();
        
        // 1) Load APE Core
        this.client.load();                    

        // 2) Intercept 'load' event. This event is fired when the Core is loaded and ready to connect to APE Server
        this.client.addEvent('load', this.callback('onLoad'));        
         
        // 3) Listen to the ready event to know when your client is connected
        this.client.addEvent('ready', this.callback('onReady'));
        
        this._super(options, events);                  
    },
    
    configureApeScripts: function () {
        var files = [
            'mootools-core', 
            'Core/APE', 
            'Core/Events', 
            'Core/Core', 
            'Pipe/Pipe', 
            'Pipe/PipeProxy', 
            'Pipe/PipeMulti', 
            'Pipe/PipeSingle', 
            'Request/Request',
            'Request/Request.Stack', 
            'Request/Request.CycledStack', 
            'Transport/Transport.longPolling',
            'Transport/Transport.SSE', 
            'Transport/Transport.XHRStreaming', 
            'Transport/Transport.JSONP', 
            'Core/Utility', 
            'Core/JSON'];
            
	    for (var i = 0; i < files.length; i++) {
		    APE.Config.scripts.push(this.settings.baseUrl + '/Source/' + files[i] + '.js');
		}
    },
    
    onLoad: function () {
        this.client.core.start(); // TODO
        this.client.addEvent('multiPipeCreate', this.callback('onMultiPipeCreate'));            
        this.triggerEvent('onLoad');
    },
    
    onReady: function () {    
        this.connected = true;              
        this.apeConnected = true;
        
        for(var channel in this.subscriptions) {
            if(this.subscriptions[channel] === false) {
                this.subscribe(channel);
            }
        }

        this.client.addEvent('onRaw', this.callback('onMessage'));
        this.client.addEvent('onCmd', this.callback('onCmd'));
        
        this.onConnected();

        this.triggerEvent('onReady');
    },
    
    onMultiPipeCreate: function (pipe, options) {
        this.pipes[pipe.name] = pipe;

        var complete = true;
        
        for(var i in this.subscriptions) {
            if(!this.pipes[i]) {
                complete = false;
            }
        }
        
        this.subscriptionsComplete = complete;
        
        if(this.subscriptionsComplete) {
            this.onSubscriptionsComplete();
        }
    },
    
    afterInitSuccess: function () {
        if(this.apeConnected) {
            this.connected = true;
        }
        
        try {
            this.subscribe(this.secret);
        } catch (e) {
            this.log('Error while join: ', e);
        }

        try {
            this.subscribe(this.connectionHash);
        } catch (e) {
            this.log('Error while join: ', e);
        } 
        
        if(this.subscriptionsComplete == true) {
            this.onConnected();
        }
    },
    
    onSubscriptionsComplete: function (data) {
        this.onConnected();
    },
    
    onConnected: function (data) { 
        if(this.connectionRetryTimeout) {
            clearTimeout(this.connectionRetryTimeout);
        }

        if(this.connectionRetryCounter > 3) {
            window.location.reload();
        } else if(data && data == 'connected') {            
            this.connectionRetryCounter = 0;
            this._super();
        } else {
            this.connectionRetryCounter++;

            this.rpc({
                service: 'debug', 
                method: 'echoRequest', 
                params: ['connected'], 
                success: this.callback('onConnected')
            }, true);
            
            this.connectionRetryTimeout = window.setTimeout(this.callback('onConnected'), 1000);
        }
    },
    
    // Public methods
    
    send: function (channel, message) {
        if(this.isDisconnected()) {
            throw 'Not connected';
        }
        
        if(!this.pipes[channel]) {
            throw 'Channel not subscribed';
        }
        
        this.triggerEvent('send', arguments);
        
        this.pipes[channel].send(message);        
        
        OpenAjax.hub.publish(channel, message);
    },
    
    subscribe: function (channel) {
        if(this.subscriptions[channel] == true) {
            throw 'Already subscribed to ' + channel;
        }
        
        if(this.isConnected()) {
            try {
                this.client.core.join(channel);
                this.subscriptions[channel] = true;
            } catch(e) {
                this.subscriptions[channel] = false;
            }
        } else {
            this.subscriptions[channel] = false;
        } 

        this._super.apply(this, arguments);
    },
    
    unsubscribe: function (channel) {
        if(this.subscriptions[channel] == true && this.isConnected()) {
           this.client.unsubscribe(channel);
           delete(this.subscriptions.channel);
        }
        
        this._super.apply(this, arguments);
    },    
    
    onMessage: function (data) {
        if(data.raw) {
            if(data.raw == this.secret || data.raw == this.connectionHash) {
                this.publishRpcResponse(data.data.message);
            } else if(this.subscriptions[data.raw]) {
                OpenAjax.hub.publish(data.raw, data.data.message);
            }
            
            this.triggerEvent('onMessage', arguments);
        }
    },

    onCmd: function () {
        this.triggerEvent('onCmd', arguments);
    }
});
});
