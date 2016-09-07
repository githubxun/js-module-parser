/**
 * Created by yangxun on 16/9/2.
 */
var ModuleContent = require( '../lib/module-content');

const RegexFunc = /function [a-zA-Z0-9]+| [a-zA-Z0-9]+=function/;
const RegexParam = "";
const RegexDepend = "";

var ModuleContent2 = require( 'path');

//去掉所有的字符串
const RegexStr = /"\S*"|'\S*'/;

const fenhao = ";;;";

var data = {
    name: 12321,
    getName: function(asdfa){},
    'named'(adf){}
}

function moduleParser(){
    var fs = require('fs');
    console.log(fs);
    /*constructor(){

     }
     parser(path){
     var moduleContent = new ModuleContent();


     return moduleContent;
     }
     _parserParams(){

     }
     _parserDepends(){

     }
     _parserFunctions(){
     "use strict";function ModuleContent(t,e,s){this.options=Object.assign({deep:!0,basePath:process.cwd()},s),this.module={type:"module",name:t,depends:[],params:[],functions:[],exports:[],source:e},this.current=this.module,this.parserStack=new Stack,this.parsered=[]}function Stack(){this.data=[],this.length=0}ModuleContent.prototype={newModule:function(t,e,s){return{type:t,name:e,depends:[],params:[],functions:[],exports:[],source:s}},addStack:function(t){var e=this.parsered.find(function(e){return e.source==t.source});return!e&&(1==this.options.deep?this.parserStack.push(t):"module"!=t.type&&this.parserStack.push(t),!0)},setCurrent:function(t){this.current=t},next:function(){return 0!=this.parserStack.length&&(this.current=this.parserStack.pop(),this.parsered.push(this.current),!0)}},Stack.prototype.push=function(t){this.data.push(t),this.length++},Stack.prototype.pop=function(){return this.length--,this.data.pop()},Stack.prototype.length=function(){return this.length},module.exports=ModuleContent;
     }*/
}

var test = function(){
    console.log('test');
}

module.exports = moduleParser;
exports.add = moduleParser;
