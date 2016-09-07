/**
 * Created by yangxun on 16/9/3.
 */
var UglifyJS = require("uglify-js");
var babel = require("babel-core");

var minify = exports.minify = function(path, options){
    return UglifyJS.minify(path, options);
};

exports.babelAndMinify = function(path){
    var srouce = babel.transformFileSync(path,
        {
            presets: ['es2015'],
            minified: true,
            compact: true
        });
    //console.log(result.code);
    var result = this.minify(srouce.code, {fromString: true});

    return result.code;
};

