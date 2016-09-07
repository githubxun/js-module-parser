/**
 * Created by yangxun on 16/9/3.
 */
var path = require('path');
var Parser = require('../lib/module-parser');

describe('js-module-parser', function() {
    describe('parser', function() {
        it('test parser method', function() {
            Parser('tmp', './tmp.js', {deep: true, basePath: __dirname});
        });
    });
});

