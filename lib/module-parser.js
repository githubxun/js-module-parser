/**
 * Created by yangxun on 16/9/2.
 */
var ModuleContent = require('./module-content');
var OptimizeFile = require('./optimize-file');
var Path = require('path');

/**
 * 模块解析
 * @param name  模块名
 * @param source  源码
 * @param options  可选参数 {deep: false}
 */
function moduleParser(name, path, options){
    if(!path || path == ""){
        return;
    }
    options = Object.assign({basePath: process.cwd()}, options);
    var source = OptimizeFile.babelAndMinify(Path.join(options.basePath, path));
    var moduleContent = new ModuleContent(name, source, options);
    var parser = new Parser(moduleContent);

    //添加解析进度
    parser.bind('process', function(){
        console.log(`当前长度: ${this.index}, 总长度: ${this.length}, 完成: ${(this.index*100/this.length).toFixed(2)}%`);
    });
    parser.bind('before', function(){
        console.log(`当前解析的名称: ${this.moduleContent.module.name}, 类型: ${this.moduleContent.module.type}`);
    });
    parser.run();

    console.log('解析完成');
    console.log(JSON.stringify(moduleContent.module));
}

const RegexFunc = /^function\(\S*\)/;
const RegexDepend = /^require\(\S*\)/;
//分割符
const RegexSplit = /^[a-zA-Z\$_][a-zA-Z\$_0-9]*[ |,|;|\.|:|=|\(]?/;
const RegexParam = /^[a-zA-Z\$_][a-zA-Z\$_0-9]*=/;    //获取变量名

/**
 * 解析对象
 * @param source 待解析的源码
 * @constructor
 */
function Parser(moduleContent){

    this.moduleContent = moduleContent;
    this.events = {      //事件
        before: [],
        after: [],
        process: []
    };

    this.module = moduleContent.current;
    this.index = 0;                 //游标
    this.length = this.module.source.length;    //总长度
}

/**
 * 开始解析
 */
Parser.prototype.run = function(){
    this.trigger('before');
    this.module = this.moduleContent.current;
    this.index = 0;
    this.length = this.module.source.length;    //总长度
    this._control();
    this.trigger('after');
};

/**
 * 解析调度中心
 * @private
 */
Parser.prototype._control = function(){
    var tag = this._next();

    //申明
    switch (tag){
        case 'var': {
            this.index++;
            this._param();
            break;
        }
        case 'function': {
            this.index++;
            this._function();
            break;
        }
        case 'require': {
            this._depends();
            break;
        }
        case 'module': {}
        case 'exports': {
            this._exports();
            break;
        }
        default: {
            console.log('=========忽略===========');
            console.log(tag);
        }
    }

    this.trigger('process');

    if(this.index < this.length-1){
        this._control();
    }
    else if(this.moduleContent.next()){
        this.run();
    }
};

/**
 * 获取下一个段落
 * @private
 */
Parser.prototype._next = function(){
    this.trim();
    //var tag = this.module.source.substring(this.index).match(RegexSplit);
    var tag = this._match(RegexSplit);
    tag = tag || this.module.source;

    var code = tag.match(/[^\w\\$_]*$/);
    if(code){
        code = code[0]||"";
    }
    this.index += (tag.length-code.length);   //移动游标

    return tag.substring(0, tag.length-1);
};

/**
 * 获取方法内容
 * @private
 */
Parser.prototype._function = function(){
    var name = this._match(/^[a-zA-Z\$_][a-zA-Z\$_0-9]*\(/);

    var params = this._parenthesis(true, name.length-1);
    var value = this._brace(true);   //获取变量名对应的值
    var source = `function${name}${params}${value}`;
    var func = this.moduleContent.newModule('function', name.substr(0, name.length-1), source);
    if(this.moduleContent.addStack(func)){
        this.module.functions.push(func);
    }
};

Parser.prototype._param = function(){
    //var param = this.module.source.substring(this.index).match(RegexParam);   //变量名称带等号(eg: name=)
    var param = this._match(RegexParam);   //变量名称带等号(eg: name=)
    this.index += param.length;   //移动游标

    var value = this._value(true);   //获取变量名对应的值

    //当前申明了一个方法
    if(RegexFunc.test(value)){
        var func = this.moduleContent.newModule('function', param.substr(0, param.length-1), value);
        this.moduleContent.addStack(func);
        this.module.functions.push(func);
    }
    //当前依赖了另外一个模块
    else if(RegexDepend.test(value)){
        var name = value.replace(/^require\(["|']|["|']\)\S*/g, ''), source = name;
        if(name[0] == '.'){
             source = OptimizeFile.babelAndMinify(Path.join(this.moduleContent.options.basePath, name+'.js'));
        }
        var module = this.moduleContent.newModule('module', name, source);
        this.moduleContent.addStack(module);
        this.module.depends.push(module);
    }
    //普通申明
    else{
        this.module.params.push(param);
    }

    if(this.module.source[this.index] == ','){
        this.index++;
        this._param();
    }
    else if(this.module.source[this.index] == ';'){
        this.index ++;
    }
};

Parser.prototype._depends = function(){
    var value = this._value(true);  //获取加载的模块名
    var name = value.substr(2, value.length-2), source = name;

    if(name[0] == '.'){
        var type = name.substr(name.lastIndexOf('.')+1);
        if(type != 'js' && type != 'json'){
            name += '.js';
        }

        source = OptimizeFile.babelAndMinify(Path.join(this.moduleContent.options.basePath, name));
    }
    var func = this.moduleContent.newModule('module', name, source);
    this.moduleContent.addStack(func);
    this.module.functions.push(func);
};

Parser.prototype._exports = function(){
    var value = this._match(/.[\w\$_]+=[\w\$_]*[,|;]/);  //获取加载的模块名
    this.index += value.length;

    var name = value.replace(/.[\w\$_]+=|,/g, "");

    this.module.exports.push(name);
};

/**
 * 获取变量申明的内容体
 * @private
 */
Parser.prototype._value = function(sign){
    var flag = true, index = this.index;
    while(flag && index<this.length){
        var char = this.module.source[index], source = char;

        switch (char){
            case '(': {
                source = this._parenthesis(false, index-this.index);
                break;
            }
            case '[': {
                source = this._bracket(false, index-this.index);
                break;
            }
            case '{': {
                source = this._brace(false, index-this.index);
                break;
            }
            case '/': {
                source = this._regex(false, index-this.index);
                break;
            }
            case '"': {}
            case "'": {
                source = this._string(false, index-this.index);
                break;
            }
            case ",": {}
            case ";": {
                flag = false;
                index--;
                break;
            }
        }
        index += source.length;
    }

    var source = this.module.source.substring(this.index, index);
    if(sign===true){
        this.index = index;
    }
    return source;
};
/**
 * 小括号
 **/
Parser.prototype._parenthesis = function(sign, offset){
    var flag = true, offset = offset || 0, index = this.index+offset;
    index++;

    while(flag && index<this.length){
        var char = this.module.source[index], source = char;
        switch (char){
            case "'": {}
            case '"': {
                source = this._string(false, index-this.index);
                break;
            }
            case "/": {
                source = this._regex(false, index-this.index);
                break;
            }
            case '[': {
                source = this._bracket(false, index-this.index);
                break;
            }
            case '{': {
                source = this._brace(false, index-this.index);
                break;
            }
            case '(': {
                source = this._parenthesis(false, index-this.index);
                break;
            }
            case ")": {
                flag = false;
                break;
            }
        }
        index += source.length;
    }
    var source = this.module.source.substring(this.index+offset, index);
    if(sign === true){
        this.index = index;
    }
    return source;
};
/**
 * 大括号
 **/
Parser.prototype._brace = function(sign, offset){
    var flag = true, offset = offset || 0, index = this.index+offset;
    index++;

    while(flag && index<this.length){
        var char = this.module.source[index], source = char;
        switch (char){
            case "'": {}
            case '"': {
                source = this._string(false, index-this.index);
                break;
            }
            case "/": {
                source = this._regex(false, index-this.index);
                break;
            }
            case '[': {
                source = this._bracket(false, index-this.index);
                break;
            }
            case '{': {
                source = this._brace(false, index-this.index);
                break;
            }
            case '(': {
                source = this._parenthesis(false, index-this.index);
                break;
            }
            case "}": {
                flag = false;
                break;
            }
        }
        index += source.length;
    }
    var source = this.module.source.substring(this.index+offset, index);
    if(sign === true){
        this.index = index;
    }
    return source;
};
/**
 * 中括号
 **/
Parser.prototype._bracket = function(sign, offset){
    var flag = true, offset = offset || 0, index = this.index+offset;
    index++;

    while(flag && index<this.length){
        var char = this.module.source[index], source = char;
        switch (char){
            case "'": {}
            case '"': {
                source = this._string(false, index-this.index);
                break;
            }
            case "/": {
                source = this._regex(false, index-this.index);
                break;
            }
            case '[': {
                source = this._bracket(false, index-this.index);
                break;
            }
            case '{': {
                source = this._brace(false, index-this.index);
                break;
            }
            case '(': {
                source = this._parenthesis(false, index-this.index);
                break;
            }
            case "]": {
                flag = false;
                break;
            }
        }
        index += source.length;
    }
    var source = this.module.source.substring(this.index+offset, index);
    if(sign === true){
        this.index = index;
    }
    return source;
};
/**
 * 字符串
 **/
Parser.prototype._string = function(sign, offset){
    var flag = true, offset = offset || 0, index = this.index+offset, type = this.module.source[index];
    index ++;

    while(flag && index<this.length){
        var char = this.module.source[index];
        switch (char){
            case "'": {}
            case '"': {
                if (type == char && this.module.source[index - 1] != '\\') {
                    flag = false;
                }
                break;
            }
        }
        index++;
    }
    var source = this.module.source.substring(this.index+offset, index);
    if(sign === true){
        this.index = index;
    }
    return source;
};
/**
 * 正则
 * 匹配正则表达是(eg:/abc/)
 **/
Parser.prototype._regex = function(sign, offset){
    var flag = true, offset = offset || 0, index = this.index+offset;
    index ++;

    while(flag && index<this.length){
        var char = this.module.source[index];
        switch (char){
            case '/': {
                if(this.module.source[index-1]!='\\'){
                    flag = false;
                }
            }
        }
        index++;
    }
    var source = this.module.source.substring(this.index+offset, index);
    if(sign === true){
        this.index = index;
    }
    return source;
};

Parser.prototype._match = function(regex, offset){
    offset = offset || 0;
    var str = this.module.source.substring(this.index-offset).match(regex);
    if(str){
        return str[0];
    }
    return "";
};

Parser.prototype.trim = function(){
    var str = this._match(/^"[^"]*"/);
    this.index += str.length;
    str = this._match(/^[^a-zA-Z0-9\$_ ]*/);
    this.index += str.length;
};

/**
 * 事件绑定
 * @param name   事件名称[before,after,process]
 * @param callback
 */
Parser.prototype.bind = function(name, callback){
    if(this.events[name]){
        this.events[name].push(callback);
    }
    else{
        console.warn(`warn: parser don't support bind [${name}] event, only support before,after,process events`);
    }
};

/**
 * 解绑事件
 * @param name
 * @param callback
 */
Parser.prototype.remove = function(name, callback){
    if(!this.events[name]){
        console.warn(`warn: parser don't support remove [${name}] event, only support before,after,process events`);
        return;
    }
    if(!callback){
        this.events[name] = [];
        return;
    }

    this.events[name] = this.events[name].filter(func=>{return func.toString() != callback.toString()});
};

/**
 * 触发event事件
 */
Parser.prototype.trigger = function(name){
    if(!this.events[name] || this.events[name].length == 0){
        return;
    }

    this.events[name].forEach(item=>{
        item.call(this, this);
    });
};

module.exports = moduleParser;
