/**
 * Liquid.Ajax.Cometd adds support for the CometD AJAX push server to Liquid.Ajax
 *
 * There also is a JSON-RPC client and server available for PHP:
 * https://github.com/smashedpumpkin/liquidlibrary/tree/master/Liquid/Ajax
 *
 * @class      Liquid.Ajax.Cometd
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2010-2011 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */
 
steal('cometd/jquery','liquid/ajax').then(function () {

Liquid.Ajax.extend('Liquid.Ajax.Cometd',
/* @Prototype */
{
    cometdConnected: false,
    subscriptions: {},

    settings: {
        cometdUrl: 'http://' + document.domain + ':8080/cometd'
    },
    
    // Constructor
    
    init: function (options, events) {
        document.domain = document.domain;
        
        $.extend(this.settings, options);
        
        $.cometd.websocketEnabled = true;

        $.cometd.addListener('/meta/handshake', this.callback('onReady'));        

        $.cometd.configure({
            url: this.settings.cometdUrl,
            logLevel: 'debug' // warn, info, debug
        });
        
        this.connect();
        
        this._super(options, events);                
    },
    
    connect: function () {
        $.cometd.handshake();
        
        this.triggerEvent('connect', arguments);        
    },
    
    disconnect: function () {
        if(this.isDisconnected()) {
            throw 'Not connected';
        }
                
        this.onDisconnect()
        
        return $.cometd.disconnect();
    },
    
    reconnect: function () {
        if(this.isConnected()) {
            this.disconnect();
        }
        
        this.triggerEvent('reconnect', arguments);
        
        this.connect();
    },  
    
    afterInitSuccess: function () {
        if(this.cometdConnected) {
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
        
        if(this.cometdConnected) {
            this.onConnected();
        }
    },
    
    // Public methods
    
    convertChannelName: function (channel) {
        return '/' + channel.replace('.', '/');
    },
    
    send: function (channel, message) {
        if(this.isDisconnected()) {
            throw 'Not connected';
        }
        
        this.triggerEvent('send', arguments);
        
        return $.cometd.publish(this.convertChannelName(channel), message);
    },
    
    subscribe: function (channel) {
        if(this.subscriptions[channel] == true) {
            throw 'Already subscribed to ' + channel;
        }
        
        if(this.isConnected()) {
            try {
                $.cometd.subscribe(this.convertChannelName(channel), this.callback('onMessage'));
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
           $.cometd.unsubscribe(this.convertChannelName(channel));
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
        // console.log('onReady', arguments);
        this.connected = true;    
        this.cometdConnected = true;       

        for(var channel in this.subscriptions) {
            if(this.subscriptions[channel] === false) {
                this.subscribe(channel);
            }
        }

        this.onConnected();

        this.triggerEvent('onReady', arguments);      
    },

    onMessage: function (m) {
        // console.log('onMessage', arguments);
        if(m.headers.destination == this.secret || m.headers.destination == this.connectionHash) {
            this.publishRpcResponse(jQuery.evalJSON(m.body));
        } else {
            OpenAjax.hub.publish(m.headers.destination, jQuery.evalJSON(m.body));
        }
        
        this.triggerEvent('onMessage', arguments);      
    }        
});
});
