var APE = {
	Config: {
		identifier: 'ape',
		init: true,
		frequency: 0,
		scripts: []
	},

	Client: function(core) {
			if(core) this.core = core;	
	}
}
APE.Client.prototype.eventProxy = [];
APE.Client.prototype.fireEvent = function(type, args, delay) {
	this.core.fireEvent(type, args, delay);
}

APE.Client.prototype.addEvent = function(type, fn, internal) {
	var newFn = fn.bind(this), ret = this;
	if(this.core == undefined){
		this.eventProxy.push([type, fn, internal]);
	}else{
		var ret = this.core.addEvent(type, newFn, internal);
		this.core.$originalEvents[type] = this.core.$originalEvents[type] || [];
		this.core.$originalEvents[type][fn] = newFn;
	}
	return ret;
}
APE.Client.prototype.removeEvent = function(type, fn) {
	return this.core.removeEvent(type, fn);
}

APE.Client.prototype.onRaw = function(type, fn, internal) {
		this.addEvent('raw_' + type.toLowerCase(), fn, internal); 
}

APE.Client.prototype.onCmd = function(type, fn, internal) {
		this.addEvent('cmd_' + type.toLowerCase(), fn, internal); 
}

APE.Client.prototype.onError = function(type, fn, internal) {
		this.addEvent('error_' + type, fn, internal); 
}

APE.Client.prototype.load = function(config){

	config = config || {};

	config.transport = config.transport || APE.Config.transport || 0;
	config.frequency = config.frequency || 0;
	config.domain = config.domain || APE.Config.domain || document.domain;
	config.scripts = config.scripts || APE.Config.scripts;
	config.server = config.server || APE.Config.server;
	config.host = config.host || APE.Config.host;

	config.init = function(core){
		this.core = core;
		for(var i = 0; i < this.eventProxy.length; i++){
			this.addEvent.apply(this, this.eventProxy[i]);
		}
	}.bind(this);

	//set document.domain
	if (config.transport != 2 && config.domain != 'auto') document.domain = config.domain;
	if (config.domain == 'auto') document.domain = document.domain;

	config.frequency = config.host || 'www';

	var iframe = document.createElement('iframe');
	iframe.setAttribute('id','ape_' + config.identifier);
	iframe.style.display = 'none';
	iframe.style.position = 'absolute';
	iframe.style.left = '-300px';
	iframe.style.top = '-300px';

	document.body.appendChild(iframe);

	if (config.transport == 2) {
		var doc = iframe.contentDocument;
		if (!doc) doc = iframe.contentWindow.document;//For IE

		//If the content of the iframe is created in DOM, the status bar will always load...
		//using document.write() is the only way to avoid status bar loading with JSONP
		doc.open();
		var theHtml = '<html><head></head>';
		for (var i = 0; i < config.scripts.length; i++) {
			theHtml += '<script src="' + config.scripts[i] + '"></script>';
		}
		theHtml += '<body></body></html>';
		doc.write(theHtml);
		doc.close();
	} else {
		iframe.setAttribute('src','http://' + config.frequency + '.' + config.server + '/?[{"cmd":"script","params":{"domain":"' + document.domain +'","scripts":["' + config.scripts.join('","') + '"]}}]');
		if (navigator.product == 'Gecko') { 
			//Firefox fix, see bug  #356558 
			// https://bugzilla.mozilla.org/show_bug.cgi?id=356558
			iframe.contentWindow.location.href = iframe.getAttribute('src');
		}
	}

	iframe.onload = function() { 
		if (!iframe.contentWindow.APE) setTimeout(iframe.onload, 100);//Sometimes IE fire the onload event, but the iframe is not loaded -_-
		else iframe.contentWindow.APE.init(config);
	}
}

if (Function.prototype.bind == null) {
	Function.prototype.bind = function(bind, args) {
		return this.create({'bind': bind, 'arguments': args});
	}
}
if (Function.prototype.create == null) {
	Function.prototype.create = function(options) {
			var self = this;
			options = options || {};
			return function(){
				var args = options.arguments || arguments;
				if(args && !args.length){
					args = [args];
				}
				var returns = function(){
					return self.apply(options.bind || null, args);
				};
				return returns();
			};
	}
}

