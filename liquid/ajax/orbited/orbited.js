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
 
steal('orbited','orbited/stomp').then(function () {

Liquid.Ajax.extend('Liquid.Ajax.Orbited',
{ /* Prototype */
    stomp: null,
    orbitedConnected: false,
    subscriptions: {},
    settings: {
        orbited_hostname: document.domain,
        orbited_port: 8000,
        stomp_hostname: 'localhost',
        stomp_port: 61613
    },
    
    // Constructor
    
    init: function (options, events) {
        TCPSocket = Orbited.TCPSocket;
        
        document.domain = document.domain;
        
        $.extend(this.settings, options);
        
        Orbited.settings.hostname   = this.settings.orbited_hostname;
        Orbited.settings.port       = this.settings.orbited_port;

        this.stomp = new STOMPClient();
        
        this.stomp.onopen = this.callback('onOpen');
        
        this.stomp.onclose = this.callback('onClose');
        
        this.stomp.onerror = this.callback('onError');
        
        this.stomp.onerrorframe = this.callback('onErrorFrame');
        
        this.stomp.onconnectedframe = this.callback('onReady');
        
        this.stomp.onmessageframe = this.callback('onMessage');                
        
        this.connect();
        
        this._super(options, events);                
    },
    
    connect: function () {
        this.stomp.connect(this.settings.stomp_hostname, this.settings.stomp_port);
        this.triggerEvent('connect', arguments);        
    },
    
    disconnect: function () {
        if(this.isDisconnected()) {
            throw 'Not connected';
        }
                
        this.onDisconnect()
        
        return this.stomp.disconnect();
    },
    
    reconnect: function () {
        if(this.isConnected()) {
            this.disconnect();
        }
        
        this.triggerEvent('reconnect', arguments);
        
        this.connect();
    },  
    
    afterInitSuccess: function () {
        if(this.orbitedConnected) {
            this.connected = true;
        }
        
        try {
            this.subscribe(this.secret);
        } catch (e) {
        }

        try {
            this.subscribe(this.connectionHash);
        } catch (e) {
        }
        
        if(this.orbitedConnected) {
            this.onConnected();
        }
    },
    
    // Public methods
    
    send: function (channel, message) {
        if(this.isDisconnected()) {
            throw 'Not connected';
        }
        
        this.triggerEvent('send', arguments);
        
        return this.stomp.send(message, channel);
    },
    
    subscribe: function (channel) {
        if(this.subscriptions[channel] == true) {
            throw 'Already subscribed to ' + channel;
        }
        
        if(this.isConnected()) {
            try {
                this.stomp.subscribe(channel);
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
           this._super.apply(this, arguments);
           this.stomp.unsubscribe(channel);
           delete(this.subscriptions.channel);
        }
    },    
    
    begin: function(id) {
        this.stomp.begin(id);
    },

    commit: function(id) {
        this.stomp.commit(id);
        
        this.triggerEvent('commit', arguments);
    },

    abort: function(id) {
        this.stomp.abort(id);

        this.triggerEvent('abort', arguments);
    },

    ack: function (message_id, transaction_id) {
        this.stomp.ack(message_id, transaction_id);
        
        this.triggerEvent('ack', arguments);
    },
    
    // Event handlers
    
    onOpen: function () {
        this.triggerEvent('onOpen', arguments);
    },
    
    onClose: function () {
        for(var channel in this.subscriptions) {
            this.subscriptions[channel] = false;
        }
        
        this.triggerEvent('onClose', arguments);        
    },
    
    onError: function () {        
        this.triggerEvent('onError', arguments);        
    },
    
    onErrorFrame: function () {     
        this.triggerEvent('onErrorFrame', arguments);           
    },
    
    onReady: function (p) {
        this.connected = true;    
        this.orbitedConnected = true;       

        for(var channel in this.subscriptions) {
            if(this.subscriptions[channel] === false) {
                this.subscribe(channel);
            }
        }

        this.onConnected();

        this.triggerEvent('onReady', arguments);      
    },

    onMessage: function (m) {
        if(m.headers.destination == this.secret || m.headers.destination == this.connectionHash) {
            this.publishRpcResponse(jQuery.evalJSON(m.body));
        } else {
            OpenAjax.hub.publish(m.headers.destination, jQuery.evalJSON(m.body));
        }
        
        this.triggerEvent('onMessage', arguments);      
    }        
});
});
