'use strict';

var async = require('async');
var tap = require('tap');
var fs = require('fs');
var path = require('path');

var filepaths = [
  path.resolve(__dirname, '../src/index.js'),
  path.resolve(__dirname, '../src/detective.js'),
  path.resolve(__dirname, '../src/unused-deps.js'),
  path.resolve(__dirname, './index.js'),
];

var files = filepaths.map(function(file){
  return fs.readFileSync(file).toString('utf-8');
});
/*
var modules = [
  [
    'acorn/dist/acorn_csp',
    'acorn/dist/walk',
    'escodegen',
    'defined',
  ],
  [
    'acorn/dist/acorn_csp',
    'acorn/dist/walk',
    'escodegen',
    'defined',
  ],
  [
    'acorn/dist/acorn_csp',
    'acorn/dist/walk',
    'escodegen',
    'defined',
  ],
  [
    'async',
    'tap',
    'fs',
    'path',
  ],
];
*/

setImmediate(function(){
  async.series([
    function(next){
      tap.test('unused paths', function(t){
        async.series([
          function(sNext){
            t.test('When there are no unused dependencies', function(st){
              var fns = require(filepaths[0]);
              fns.lintProjectUnused(path.resolve(__dirname, '..'), function(err, res){
                if(err) return st.error(err, 'Should not return an execution error');
                st.notOk(err, 'it should not return an execution error');
                st.ok(res instanceof Array, 'result should be a list');
                st.notOk(res.length, 'List should be empty');
                st.end();
              });

              sNext();
            });
          },

          function(sNext){
            t.test('When there are unused dependencies, it return the dependencies', function(st){
              var fns = require(filepaths[0]);
              var unused = [
                'defined',
                'extra',
                'more',
              ];

              fns.lintProjectUnused(__dirname, function(err, res){
                if(err) return st.error(err, 'Should not return an execution error');
                st.notOk(err, 'it should not return an execution error');
                st.equal(res.length, unused.length, 'The number unused should equal the number of errors');
                st.equal(res[0].message, unused[0], `${unused[0]} Should be in the message`);
                st.equal(res[1].message, unused[1], `${unused[1]} Should be in the message`);
                st.equal(res[2].message, unused[2], `${unused[2]} Should be in the message`);
                st.end();
              });

              sNext();
            });
          },
        ], function(err){
          if(err) return t.error(err);
          t.end();
          next();
        });
      });
    },
  ]);
});
