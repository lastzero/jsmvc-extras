$.Class.extend('Liquid.Wiki', {
    wiki: {},  // TODO
    page: {},
    history: {},
    defaultStyle: 'color_turquoise',
    
    onLoadSuccess: function (callback, data) {    
        //console.log(data);
        var refresh = false;
        
        if(data.wiki) {
            for(var i in data.wiki) {
                if(!this.wiki[i] || data.wiki[i] != this.wiki[i]) {
                    refresh = true;
                    break;
                }
            }

            this.wiki = data.wiki;            
        }
        
        if(data.error && !data.history && !data.page) {
            this.page = {};
            this.history = {};
            refresh = true;
        }
        
        if(data.page) {
            this.page = data.page;
        }
        
        if(data.history) {
            for(var i in data.history) {
                if(!this.history[i] || data.history[i] != this.history[i]) {
                    refresh = true;
                    break;
                }
            }

            this.history = data.history;
        }
        
        if(refresh) {
            OpenAjax.hub.publish('liquid.wiki.updated', this);
        }
        
        if(callback) {
            if(data.rendered) {
                callback(data.rendered);
            } else if(data.error) {                
                callback('');
            } else {
                callback();
            }
        }

        $.unblockUI();
    },
    
    onLoadError: function (callback, data) {
        if(data && data['data'] && data['data']['class'] == 'Liquid_Storage_Adapter_Exception_NamespaceNotFound') {
            alert('Wiki does not exist');
            window.location.hash = '#index';
        }

        if(callback) {
            callback(data);
        }
    },
    
    getPages: function (success, error) {
        Ajax.rpc({
            service: 'wiki', 
            method: 'getPages', 
            params: [], 
            success: success,
            error: error
        });
    }, 
    
    renderHtml: function (content, success, error) {
        $.blockUI();
        
        Ajax.rpc({
            service: 'wiki', 
            method: 'renderAsHtml', 
            params: [content], 
            success: this.callback('onRenderHtml', success),
            error: this.callback('onRenderHtml', error)
        });    
    },
    
    onRenderHtml: function (callback, data) {
        $.unblockUI();
        if(callback) {
            callback(data);
        }
    },
    
    loadHtml: function (pageName, version, success, error) {
        $.blockUI();
        
        Ajax.rpc({
            service: 'wiki', 
            method: 'init', 
            params: [pageName, 'html', version], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    },
    
    loadPdf: function (pageName, version, success, error) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'init', 
            params: [pageName, 'pdf', version], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    },

    loadPdfBook: function (pageName, version, success, error) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'init', 
            params: [pageName, 'pdfbook', version], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    },

    loadLatex: function (pageName, version, success, error) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'init', 
            params: [pageName, 'latex', version], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    },
    
    loadText: function (pageName, version, success, error) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'init', 
            params: [pageName, 'text', version], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    },
    
    loadPage: function (pageName, version, success, error) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'init', 
            params: [pageName, null, version], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    },        
    
    savePage: function (pageName, content, success, error) {
        if(this.wiki.history) {
            this.createPage.apply(this, arguments);
        } else {
            this.replacePage.apply(this, arguments);
        }
    },
    
    replacePage: function (pageName, content, success, error) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'replace',
            params: [pageName, content, this.getStyle()], 
            success: this.callback('onSaveSuccess', success),
            error: this.callback('onSaveError', error)
        });
    },
    
    createPage: function (pageName, content, success, error) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'create',
            params: [pageName, content, this.getStyle()], 
            success: this.callback('onSaveSuccess', success),
            error: this.callback('onSaveError', error)
        });
    },
    
    onSaveSuccess: function (callback, data) {        
        if(callback) {
            callback(data);
        }
        
        $.unblockUI();        
    },
    
    onSaveError: function (callback, data) {
        $.unblockUI();

        if(callback) {
            callback(data);
        }
    },
    
    deletePage: function (pageName, success, error) {
        $.blockUI();
        
        Ajax.rpc({
            service: 'wiki', 
            method: 'delete',
            params: [pageName], 
            success: this.callback('loadProperties', success), 
            error: this.callback('loadProperties')
        });
    },
    
    setStyle: function (pageName, style) {
        $.blockUI();
        
        this.defaultStyle = style;
        
        try {
            this.page.meta.style = style;
        } catch(e) {
        }

        Ajax.rpc({
            service: 'wiki', 
            method: 'setStyle', 
            params: [pageName, style]
        });
    },
    
    getStyle: function () {
        try {
            var result = this.page.meta.style;                
            this.defaultStyle = result;
            return result;
        } catch(e) {
            return this.defaultStyle;
        }
    },
    
    addAuthors: function (authors, callback) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'addAuthors', 
            params: [authors], 
            success: this.callback('loadProperties', callback), 
            error: this.callback('loadProperties')
        });
    },
    
    removeAuthor: function (author, callback) {
        $.blockUI();

        Ajax.rpc({
            service: 'wiki', 
            method: 'removeAuthor', 
            params: [author], 
            success: this.callback('loadProperties', callback), 
            error: this.callback('loadProperties')
        });
    },
    
    enablePublicAccess: function () {
        $.blockUI();
        
        Ajax.rpc({
            service: 'wiki', 
            method: 'enablePublic', 
            params: [], 
            success: this.callback('loadProperties'), 
            error: this.callback('loadProperties')
        });
    },

    disablePublicAccess: function () {
        $.blockUI();
        
        Ajax.rpc({
            service: 'wiki', 
            method: 'disablePublic', 
            params: [], 
            success: this.callback('loadProperties'), 
            error: this.callback('loadProperties')
        });
    },
    
    enableHistory: function () {
        $.blockUI();
        
        Ajax.rpc({
            service: 'wiki', 
            method: 'enableHistory', 
            params: [], 
            success: this.callback('loadProperties'), 
            error: this.callback('loadProperties')
        });
    },

    disableHistory: function () {
        $.blockUI();
        
        Ajax.rpc({
            service: 'wiki', 
            method: 'disableHistory', 
            params: [], 
            success: this.callback('loadProperties'), 
            error: this.callback('loadProperties')
        });
    },
    
    loadProperties: function (success, error) {
        Ajax.rpc({
            service: 'wiki', 
            method: 'init', 
            params: [], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    },
    
    renamePage: function (oldName, newName, success, error) {
        $.blockUI();
        Ajax.rpc({
            service: 'wiki', 
            method: 'renamePage', 
            params: [oldName, newName], 
            success: this.callback('onLoadSuccess', success),
            error: this.callback('onLoadError', error)
        });
    }
},{});
