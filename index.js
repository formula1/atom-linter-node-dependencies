/* global atom */

'use strict';

module.exports = {
  activate: function(){
    console.log('activate linter-require');
  },

  provideLinter: function(){

    return {
      showErrorInline: true,
      name: 'require',
      grammarScopes: ['source.js', 'source.json'],
      scope: 'project',
      lintOnFly: false,
      lint: function(textEditor){
        var async = require('async');
        var path = require('path');
        var util = require('./src/util');
        var src = require('./src');

        var filePath = textEditor.getPath();
        var text = textEditor.displayBuffer.buffer.cachedText;
        var directories = atom.project.getDirectories();

        return new Promise(function(res, rej){
          var fns = [
            function(next){
              src.lintProjectUnused(directories.map(function(dir){
                return dir.path;
              }), next);
            },
          ];
          if(path.extname(textEditor.getPath()) !== '.json'){
            fns.push(function(next){
              src.lintTextEditor(text, filePath, next);
            });
          }

          async.parallel(fns,
          function(err, ret){
            if(err) return rej(err);

            res(ret
              .reduce(function(p, c){ return p.concat(c); }, [])
              .map(util.toAtomError)
            );
          });
        }).catch(function(e){
          console.error(e);
        });
      },
    };
  },
};
