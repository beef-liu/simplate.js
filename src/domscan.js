(function (window) {
    if(window.$domscan) return;

    function DomScan() {

        /**
         *  e.g. 
            <div id="testdata" data="Data{}">
                <div>
                    <span data="id">001</span>
                    <input type="text" data="name" value="name---">
                </div>
                <table data="children[]">
                    <thead>
                        <tr>
                            <td>name</td>
                            <td>age</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr data="Child{}">
                            <td data="name">Jack</td>
                            <td data="age">5</td>
                        </tr>
                        <tr data="Child{}">
                            <td data="name">Jane</td>
                            <td data="age">8</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            ---------------- ----------------
            var result = scanNodeAsObj($('#testdata', "data"));
            ---------------- result output ----------------
            {
                "id": "001",
                "name": "name----",
                "children" : [
                    {
                        "name": "Jack",
                        "age": "5"
                    }
                    {
                        "name": "Jane",
                        "age": "8"
                    }
                ]
            }
         * @param rootNode root dom node
         * @param attrName name of attribute, is the mark for filtering.
         */
        this.scan = function (rootNode, attrName) {
            var objStack = [];
            var callback = {
                onForward: function(node, depth) {
                    console.log("onForward[" + objStack.length + "] - <" + $(node)[0].nodeName + " " + attrName + "=" + $(node).attr(attrName));

                    var newObj;
                    var fieldInfo = parseFieldInfo($(node).attr(attrName));
                    if(fieldInfo.type == 1) {
                        newObj = [];
                    } else {
                        newObj = {};
                    }

                    if(objStack.length > 0) {
                        var curObj = objStack[objStack.length - 1];
                        if(curObj.push) {
                            curObj.push(newObj);
                        } else {
                            curObj[fieldInfo.name] = newObj;
                        }
                    }

                    objStack.push(newObj);
                    console.log("objStack.push - depth:" + depth);
                }, 
                onBackward: function(node, depth) {
                    console.log("onBackward[" + objStack.length + "] - <" + $(node)[0].nodeName + " " + attrName + "=" + $(node).attr(attrName));
                    if(objStack.length > 1) {
                        objStack.pop();
                    }
                    console.log("objStack[" + objStack.length + "] pop - depth:" + depth);
                }, 
                onLeafNode: function(node, depth) {
                    console.log("onLeafNode[" + objStack.length + "] - <" + $(node)[0].nodeName + " " + attrName + "=" + $(node).attr(attrName));
                    var newObj;
                    var fieldInfo = parseFieldInfo($(node).attr(attrName));
                    if(fieldInfo.type == 1) {
                        newObj = [];
                    } else if(fieldInfo.type == 2) {
                        newObj = {};
                    } else {
                        newObj = getNodeVal(node);
                    }

                    var curObj = objStack[objStack.length - 1];
                    if(curObj.push) {
                        curObj.push(newObj);
                    } else {
                        curObj[fieldInfo.name] = newObj;
                    }
                }
            };
            
            visitNodeDeepPriorFilterByAttr(
                attrName,
                rootNode, 0, 
                callback
            );

            return objStack[0];
        };

        /**
         * 
         * @param {*} name 
         * @return {
                name: String, 
                type: int(0:String  1:[] 2:{})
            }
         */
        function parseFieldInfo(name) {
            if(name.length <= 2) {
                return {name: name, type: 0};
            } else {
                var suffix = name.substring(name.length - 2, name.length);
                if(suffix == "[]") {
                    return {name: name.substring(0, name.length - 2), type: 1};
                } else if(suffix == "{}") {
                    return {name: name.substring(0, name.length - 2), type: 2};
                } else {
                    return {name: name, type: 0};
                }
            }
        }

        /*
        function trimNameOfArrayType(name) {
            return name.substring(0, name.length - 2);
        }
        function isNameOfArrayType(name) {
            return name != null && name.endsWith("[]");
        }
        function isInteger(val) {
            return Number.isInteger(Number(val));
        }
        */

        var INPUT_NODE_NAMES = "input,textarea,select,";
        function getNodeVal(node) {
            var nodeTmp;
            if(node.length) {
                nodeTmp = node[0];
            } else {
                nodeTmp = node;
            }

            var nodeName = nodeTmp.nodeName.toLowerCase();
            if(INPUT_NODE_NAMES.indexOf(nodeName) >= 0) {
                return $(node).val();
            } else {
                return $(node).text();
            }
        }

        /**
         * 
         * @param {*} node 
         * @param {*} depth 
         * @param {*} callback {
            onForward: function(node, depth) {}, 
            onBackward: function(node, depth) {}, 
            onLeafNode: function(node, depth) {}
        }
         */
        function visitNodeDeepPriorFilterByAttr(
            attrName,
            node, depth,
            callback
        ) {
            if($(node).find('[' + attrName + ']' + ":first").length == 0) {
                callback.onLeafNode(node, depth);
                return;
            }

            callback.onForward(node, depth);
            
            //visit all children
            $(node).children().each(function (i, child) {
                var actChild;
                if($(child).attr(attrName) != null) {
                    actChild = child;
                } else {
                    actChild = $(child).find('[' + attrName + ']' + ":first");
                    if(actChild.length == 0) {
                        return;
                    }
                }
                visitNodeDeepPriorFilterByAttr(attrName, actChild, depth + 1, callback);
            });

            callback.onBackward(node, depth);
        }

        /*
        function visitNodeDeepPrior(
            node, depth,
            callback
        ) {
            var children = $(node).children();
            if(children.length == 0) {
                callback.onLeafNode(node, depth);
                return;
            }

            callback.onForward(node, depth);
            $(children).each(function (i, e) {
                visitNodeDeepPrior(
                    e, depth + 1,
                    callback
                );
            });
            callback.onBackward(node, depth);
        }
        */
        
    }

    window.$domscan = new DomScan();

})(window);
