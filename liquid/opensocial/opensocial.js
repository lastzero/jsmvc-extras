/**
 * Liquid.Opensocial is a utilty class that wraps Google Friend Connect
 *
 * It requires the use of Liquid_Service_Opensocial on the server side (plus Liquid.Ajax for JSON-RPC):
 * https://github.com/smashedpumpkin/liquidlibrary/blob/master/Liquid/Service/Opensocial.php 
 * 
 * @class      Liquid.Opensocial
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2010 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */
 
$.Class.extend('Liquid.Opensocial', 
/* @Prototype */
{
    _user: false,

    _authenticated: false,
    
    service: 'opensocial',
    
    init: function(options) {
        if(options && options.service) {
            this.service = options.service;
        }        
        
        google.friendconnect.container.setParentUrl('/' /* location of rpc_relay.html and canvas.html */);
        google.friendconnect.container.initOpenSocialApi({
            site: Ajax.config.opensocialAppId,
            onload: this.callback('checkStatus')
        });
    },
    
    checkStatus: function () { 
        var req = opensocial.newDataRequest();
        req.add(req.newFetchPersonRequest("OWNER"), "owner_data");
        req.add(req.newFetchPersonRequest("VIEWER"), "viewer_data");
        var idspec = new opensocial.IdSpec({
          'userId' : 'OWNER',
          'groupId' : 'FRIENDS'
        });
        req.add(req.newFetchPeopleRequest(idspec), 'site_friends');
        req.send(this.callback('onSessionChange'));
    },        
        
    onSessionChange: function (data) {
        if (!data.get("viewer_data").hadError()) {
            this._authenticated = true;
            this.getUser(this.callback('publishLogin'), this.callback('showLoginError'));            
        } else {
            this._authenticated = false;
            this._user = false;            
            OpenAjax.hub.publish('opensocial.session.logout');
        }        
    },
    
    publishLogin: function(user) {
        OpenAjax.hub.publish('opensocial.session.login', user);
    },
    
    showLoginError: function () {
        alert('There was an error during login');
    },
    
    getUser: function (success, error) {
        if(!this.authenticated()) {
            if(error) {
                error();
            }

            return;
        }
            
        if(this._user) {
            if(success) {
                success(this._user);
            }
            return;
        }

        Ajax.rpc({service: 'opensocial', method: 'getUser', 'success': this.callback('storeUser', success), 'error': error});            
    },    
    
    storeUser: function (success, user) {      
        this._user = user;                
        
        if(success) {
            success(user);
        }
    },
    
    login: function () {
        google.friendconnect.requestSignIn();
    },
    
    logout: function () {
        google.friendconnect.requestSignOut();
    },
    
    authenticated: function () {
        return (this._authenticated == true);
    }
});
