/**
 * Created by yangxun on 16/9/3.
 */
var OptimizeFile = require("../lib/optimize-file");
var babel = require("babel-core");
var path = require('path');

describe('optimize', function() {
    describe('#minify()', function() {
        it('should return the minify string', function() {
            this.retries(2);
            var result = OptimizeFile.minify(path.join(process.cwd(), 'lib', 'module-parser.js'));
            console.log(result.code);
        });
    });

    describe('.babel', function(){
        it('test babel-core transform', function(){
            var result = babel.transformFileSync(path.join(process.cwd(), 'lib', 'module-parser.js'),
                {
                    presets: ['es2015'],
                    minified: true,
                    compact: true
                });
            console.log(result.code);
        });
    });

    describe.only('minify and babel', function() {
        it('should console log the babeled and minified string', function() {
            var result = babel.transformFileSync(path.join(process.cwd(), 'test', 'tmp.js'),
                {
                    presets: ['es2015'],
                    minified: true,
                    compact: true
                });
            //console.log(result.code);
            var name = "adf\"sdf";
            var result2 = OptimizeFile.minify(result.code, {fromString: true});
            console.log(result2.code);
            var str = result2.code.match(/^"[^"]*"/);
            console.log(str);
            //console.log(result2.code.substr(str.length).match(/^[a-zA-Z$_][a-zA-Z$_0-9]*[( |,|;|\.|=)]?/g));
        });
    });

    describe('test regex match', function() {
        it('should console log the matched string', function() {
            var ddd = 'data={name:12321,getName:function(e){},named:function(e){}};module.exports=moduleParser';

            console.log(ddd);

            console.log(ddd.match(/^[a-zA-Z$_][a-zA-Z$_0-9]*[( |,|;|.|=|)]?/));
        });
    });
});

