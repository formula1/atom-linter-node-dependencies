/* global atom */

'use strict';

module.exports = {
  activate: function(){
    console.log('activate linter-require');
  },

  provideLinter: function(){

    return {
      showErrorInline: true,
      name: 'dependencies',
      grammarScopes: ['source.js', 'source.json'],
      scope: 'project',
      lintOnFly: false,
      lint: function(){
        var util = require('./src/util');
        var src = require('./src');

        var directories = atom.project.getDirectories();

        return new Promise(function(res, rej){
          src(
            directories.map(function(dir){
              return dir.path;
            }),

            function(err, errors){
              if(err) return rej(err);
              res(errors.map(util.toAtomError));
            }
          );
        }).catch(function(e){
          console.error(e);
        });
      },
    };
  },
};
