(function () {
    //////////////// Global variables ////////////////
    var _namespace = "s";
    
    var NAME_NAMESPACE = "simplate.namespace";
    if(window[NAME_NAMESPACE]) {
        _namespace = window[NAME_NAMESPACE];
    }

    var _idSeq  = 0;
    ////////////////  ////////////////
    
    //avoid duplicated
    if(window.$simplate) return;

    function SimpleTemplate (rootNode) {
        var _rootNode = rootNode;
        //var _rootId;
        var _compiledFunc;

        prepare();

        this.render = function (scope) {
            renderTemplate(scope);
        };

        function prepare () {
            //_rootId = checkSID(_rootNode);
            _compiledFunc = compile(_rootNode);
        }

        function renderTemplate(scope) {
            $(_rootNode).empty();
            var html = callCompiledFunc(scope, _compiledFunc);
            $(_rootNode).html(html);
        }

        function compile(rootNode) {
            var codeBlock = {
                retVarName: "___genhtml_" + (new Date()).getTime(),
                code: "",
            };

            codeBlock.code += "var " + codeBlock.retVarName + " = ''; \n";
            
            genCode(codeBlock, $(rootNode).html());

            codeBlock.code += "  return " + codeBlock.retVarName + ";" + '\n';

            //debug
            //console.log("template code -----> \n" + codeBlock.code);
            return compileCode(codeBlock.code);
        }

        function genCode(codeBlock, html) {
            searchTemplate(html, function (isTemplate, text) {
               if(isTemplate) {
                   //template
                   var tmplCode = decodeXmlContent(text);
                   codeBlock.code += tmplCode + '\n';
               } else {
                   //{{xxx}} need be replaced
                   codeBlock.code += codeBlock.retVarName 
                            + ' += "' + encodeStringVar(text) + '"' 
                            + '.replace(/\\{\\{([\\s\\S]+?)\\}\\}/g, function (caught, content) {' + '\n'
                            //+ '  console.log("content:" + content);' + '\n'
                            //+ '  var val = (new Function("with (this) {return " + content + "}")).call(this);' + '\n'
                            //+ '  var val = (new Function("{return " + content + "}")).call(this);' + '\n'
                            + ' var val = eval(content);' + '\n'
                            //+ '  console.log("val:" + val);' + '\n'
                            + '  return val;' + '\n'
                            + '});' + '\n'
                            ;
               }
            });
        }

        function searchTemplate(html, callback) {
            var patternOfTmplBegin = '<template ' + _namespace + '="">';
            var patternOfTmplEnd = '</template>';

            var begin  = 0;
            while(1) {
                var tmplBegin = html.indexOf(patternOfTmplBegin, begin);
                if(tmplBegin < 0) {
                    break;
                }

                var tmplEnd = html.indexOf(patternOfTmplEnd, tmplBegin + 1);
                if(tmplEnd < 0) {
                    break;
                }

                callback(false, html.substring(begin, tmplBegin));
                
                callback(true, html.substring(tmplBegin + patternOfTmplBegin.length, tmplEnd));
                tmplEnd += patternOfTmplEnd.length;

                begin = tmplEnd;
            }
            if(begin < html.length) {
                callback(false, html.substring(begin));
            }
        }

        /*
        function genCode_old(codeBlock, node) {
            var nodes = $(rootNode).children();
            nodes.each(function(i, tmplNode) {
                if(tmplNode.tagName.toLowerCase() == "template") {
                    //template
                    code += tmplNode.innerHTML + "\n";
                } else {
                    //other nodes need be output as contents
                    code +=  varHtml + ' += "' + encodeStringVar(tmplNode.outerHTML) + '"'
                            + '.replace(/\\{\\{([\\s\\S]+?)\\}\\}/g, function (caught, content) {' + '\n'
                            + '  console.log("content:" + content);' + '\n'
                            //+ '  var val = (new Function("with (this) {return " + content + "}")).call(this);' + '\n'
                            //+ '  var val = (new Function("{return " + content + "}")).call(this);' + '\n'
                            + ' var val = eval(content);' + '\n'
                            + '  console.log("val:" + val);' + '\n'
                            + '  return val;' + '\n'
                            + '});' + '\n'
                            ;
                }
            });
        }
        */

        function compileCode( code) {
            return (new Function("with (this) {\n" + code + "\n}"));
        }

        function callCompiledFunc(scope, func) {
            return func.call(scope);
        }

        /*
        function checkSID(node) {
            var attrName = wrapWithNamespace("id");
            var sId = $(node).attr(attrName);
            if(!sId) {
                sId = newId();
                $(node).attr(attrName, sId);
            }

            return sId;
        }
        */
    }

    function newId () {
        return "__simplate_" + (new Date()).getTime() + "_" + (++ _idSeq);
    }

    function wrapWithNamespace(name) {
        return _namespace + "-" + name;
    }

    function domClearChildren(node) {
        
    }

    function decodeXmlContent(str) {
        return str.replace(/\&lt;|\&gt;|\&amp;|\&apos;|\&quot;/g, function(caught) {
            if(caught == '&lt;') {
                return '<';
            } else if (caught == "&gt;") {
                return ">";
            } else if (caught == "&amp;") {
                return "&";
            } else if (caught == "&apos;") {
                return "\\";
            } else if (caught == "&quot;") {
                return "\"";
            } else {
                return caught;
            }
        });
    }
    
    function encodeStringVar(str) {
        return str.replace(/\"|\r|\n/g, function(caught) {
            //console.log("caught:" + caught + " content:" + content);
            if(caught == '"') {
                return '\\"';
            } else if (caught == "\r") {
                return "\\r";
            } else if (caught == "\n") {
                return "\\n";
            } else if (caught == "\\") {
                return "\\\\";
            } else {
                return caught;
            }
        });
    }
    

    //expose
    window.$simplate = {
        build: function (node) {
            return new SimpleTemplate(node);
        }
    };

})();
