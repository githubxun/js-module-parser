/**
 * Created by yangxun on 16/9/2.
 * 记录每个模块解析后的详情信息
 * [模块按照node的模块划分法,每个文件即为一个模块]
 */
//var ObjectId = require('./objectid');

function ModuleContent (name, source, options){
    this.options = Object.assign({deep: true, basePath: process.cwd()}, options);
    this.module = {
        //id: ObjectId().toHexString(),
        type: 'module',              //类型枚举[module,function]
        name : name,             //名称
        depends : [],          //依赖的模块
        params : [],           //属性
        functions : [],        //方法
        exports: [],           //提供给外部的接口
        source : source            //源码
    };                 //当前解析的模块
    this.current = this.module;
    this.parserStack = new Stack();     //待解析堆栈
    this.parsered = [];
}

ModuleContent.prototype = {
    newModule(type, name, source){
        return {
            type: type,
            name : name,             //名称
            depends : [],          //依赖的模块
            params : [],           //属性
            functions : [],        //方法
            exports: [],           //提供给外部的接口
            source : source            //源码
        }
    },
    addStack(module){
        var m = this.parsered.find(item=>{return item.source == module.source});

        if(m){
            return false;
        }

        if(this.options.deep == true){
            this.parserStack.push(module);
        }
        else if(module.type != 'module'){
            this.parserStack.push(module);
        }
        return true;
    },
    setCurrent(module){
        this.current = module;
    },
    next(){
        if(this.parserStack.length ==0){
            return false;
        }
        this.current = this.parserStack.pop();
        this.parsered.push(this.current);

        return true;
    }
};

/**
 * 堆栈
 * @constructor
 */
function Stack(){
    this.data = [];
    this.length = 0;
}

Stack.prototype.push = function(data){
    this.data.push(data);
    this.length ++;
};
Stack.prototype.pop = function(){
    this.length--;
    return this.data.pop();
};
Stack.prototype.length = function(){
    return this.length;
};

module.exports = ModuleContent;
