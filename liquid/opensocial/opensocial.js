$.Class.extend('Liquid.Opensocial', {
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
