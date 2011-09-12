/**
 * Liquid.Facebook is a utilty class that wraps Facebook Connect
 *
 * It requires the use of Liquid_Service_Facebook on the server side (plus Liquid.Ajax for JSON-RPC):
 * https://github.com/smashedpumpkin/liquidlibrary/blob/master/Liquid/Service/Facebook.php 
 * 
 * @class      Liquid.Facebook
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2010 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */
 
$.Class.extend('Liquid.Facebook', 
/* @Prototype */
{
    _user: false,
    
    service: 'facebook',
    
    init: function(options) {
        if(options && options.service) {
            this.service = options.service;
        }
        
        FB.init({
            appId: Ajax.config.facebookAppId, 
            status: true, 
            cookie: true, 
            xfbml: true
        });
        
        FB.Event.subscribe('auth.sessionChange', this.callback('onSessionChange'));        
    },
        
    onSessionChange: function (data) {
        if (data.session) {
            this.getUser(this.callback('publishLogin'), this.callback('showLoginError'));            
        } else {
            this._user = false;            
            OpenAjax.hub.publish('facebook.session.logout');
        }        
    },
    
    publishLogin: function(user) {
        OpenAjax.hub.publish('facebook.session.login', user);
    },
    
    showLoginError: function () {
        alert('There was an error during login');
    },
    
    getUser: function (success, error) {
        FB.getLoginStatus(this.callback('onLoginStatus', success, error)); 
    },    
    
    onLoginStatus: function (success, error, response) {   
        if (response.session) {
            if(this._user) {
                if(success) {
                    success(this._user);
                }
                return;
            }

            Ajax.rpc({service: 'facebook', method: 'getUser', 'success': this.callback('storeUser', success), 'error': error});
        } else {
            if(error) {            
                error(response);
            }
        }
    },
    
    storeUser: function (success, user) {      
        this._user = user;
        
        if(success) {
            success(user);
        }
    },
    
    login: function () {
        FB.login();
    },
    
    logout: function () {
        FB.logout();
    },
    
    authenticated: function () {
        return(this._user != false);
    }
});
