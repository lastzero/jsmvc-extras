/*
 * Checkstyle XML output plugin using JSLint
 *
 * The output file can be used for integration with a CI server
 *
 * @author     Michael Mayer
 * @copyright  Copyright (c) 2011 Michael Mayer (http://www.liquidbytes.net/)
 * @license    http://www.opensource.org/licenses/mit-license.php MIT License
 * @license    http://www.opensource.org/licenses/gpl-2.0.php GPL v2
 */
 
 steal('steal/build').then('steal/clean/beautify.js','steal/clean/jslint.js','steal/rhino/prompt.js', function (steal) {
    var escapeHTML = function (content) {
            return content.replace(/&/g,'&amp;')
                    .replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;')
                    .replace(/"/g, '&#34;')
                    .replace(/'/g, "&#39;");
        }
    var extend = function( d, s ) {
            for ( var p in s ) d[p] = s[p];
            return d;
        },
        lintAndPrint = function (out, predefined) {

        JSLINT(out,{
            devel: true, 
            eqeqeq: false, 
            forin: true, 
            browser: true, 
            windows: true, 
            rhino: true, 
            onevar: false,
            immed: true,
            undef: true,
            nomen: false,
            plusplus: false,
            maxlen: 120,
            indent: 4,
            newcap: false,
            css: true,
            white: true,
            predef : predefined
        });
        if(JSLINT.errors.length){
            //var lines = out.split('\n'), line, error;
            for(var i = 0; i < JSLINT.errors.length; i++){
                var error = JSLINT.errors[i];
                var severity = 'warning';
                if(!error.evidence){
                    break;
                }
                line = error.evidence.replace(/\t/g,"     ");
                
                var evidence = escapeHTML(
                    line.substring(
                        Math.max(error.character-25, 0), 
                        Math.min(error.character+25, line.length)
                    ).replace(/^\s+/,""));

                if(error.reason == 'Extra comma.') {
                    severity = 'error';
                }

                print('    <error line="'+error.line+'" column="'+ error.character + '" severity="'+severity+'" message="'+escapeHTML(error.reason)+'" source="JSlint.Error" evidence="'+evidence+'"/>');
            }
        }
        
        var data  = JSLINT.data();

        if(data.unused){
            for(var i =0; i < data.unused.length; i++){
                print('    <error line="'+data.unused[i].line+'" column="'+ data.unused[i].character + '" severity="notice" message="Unused variable: '+escapeHTML(data.unused[i].name)+'" source="JSlint.Unused"/>');          
            }
        }
        
        return JSLINT.errors.length > 0 
    }
    
    steal.jslint = function (url, options) {
        options = extend(
            {indent_size: 1, 
             indent_char: '\t', 
             space_statement_expression: true,
             jquery : false},
            steal.opts(options || {}, {
                //compress everything, regardless of what you find
                all : 1,
                //folder to build to, defaults to the folder the page is in
                to: 1,
                print : 1,
                jslint :1,
                predefined: 1
            }) )
            
        print('<?xml version="1.0" encoding="UTF-8"?>');
        print('<checkstyle version="1.3.0">');
        
        var folder = steal.File(url).dir(),
            clean = /\/\/@steal-clean/
        
        steal.build.open(url, function (files) {
        
            files.each(function (script, text, i) {
                if(!text || !script.src){
                    return;
                }
                var path = steal.File(script.src).joinFrom(folder).replace(/\?.*/,"");
                
                if(script.src.substr(script.src.length - 3) != 'ejs' 
                        && script.src.substr(script.src.length - 3) != 'css' 
                        && script.src.substr(6, 6) != 'jquery' 
                        && script.src.substr(6, 5) != 'steal'
                        ) {
                    print('  <file name="' + escapeHTML(script.src.substr(6)) + '">');
                    lintAndPrint(text, options.predefined || {});
                    print('  </file>');
                }
            })
        });
        
        print('</checkstyle>');
    };
})
