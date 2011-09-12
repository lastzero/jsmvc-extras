/**
 * This plugin outputs a dot (http://www.graphviz.org/pdf/dotguide.pdf) graph of your class relationships
 *
 * The dot file can be converted to a PDF file like this:
 *
 * dot -Tpdf Myapp.dot -o Myapp.pdf
 * 
 * Example:
 * steal(
 *   'myapp',
 *   'steal/reflect'
 * ).then(
 *    function () {
 *      steal.reflect(Myapp, false, 'Myapp');
 *    }
 * );
 *
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2011 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */

steal.reflect = function (ns, prev_ns, name, out) {
    if(!prev_ns) {
        if(navigator.userAgent.match(/Rhino/)) {
            var fstream = new java.io.FileWriter(name + '.dot', false);
	        out = new java.io.BufferedWriter(fstream);
	    } else {
	        $('body').append('<pre>');
	        out = {
	            write: function (output) { $('body pre:last').append(output); },
	            close: function () { $('body').append('</pre>'); }
	        }
	    }
        
        out.write('digraph ' + name + ' {' + "\n");
        out.write('    rankdir=LR' + "\n");
    }
    
    for(var i in ns) {
        if(typeof ns[i] == 'function' && typeof ns[i].setup == 'function' && prev_ns != ns[i] && ns != ns[i] && ns != prev_ns && ns[i].shortName == i) {
            try {
                out.write('    "' + ns[i].prototype.__proto__.Class.fullName + '" -> "' + name + '.' + i + '"\n');
            } catch(e) {
                if(console && console.log) {
                    console.log('Could not find parent for ' + name + '.' + i);
                }
            }
                                   
            steal.reflect(ns[i], ns, name ? name + '.' + i : i, out);
        } else if(typeof ns[i] == 'object' && ns[i] != null && prev_ns != ns[i] && ns != ns[i] && ns != prev_ns && (!ns[i].shortName || ns[i].shortName == i)) {
            steal.reflect(ns[i], ns, name ? name + '.' + i : i, out);
        }
    }
    
    if(!prev_ns) {
        out.write('}');			
        out.close();
    }
}

