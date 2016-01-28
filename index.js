/* global atom */

'use strict';

var lintTextEditor, lintProjectUnused;

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

        return new Promise(function(res, rej){
          var fns = [
            function(next){
              lintProjectUnused(atom.project, next);
            },
          ];
          if(path.extname(textEditor.getPath()) !== '.json'){
            fns.push(function(next){
              lintTextEditor(textEditor, next);
            });
          }

          async.parallel(fns,
          function(err, ret){
            if(err) return rej(err);

            res(ret.reduce(function(p, c){ return p.concat(c); }, []));
          });
        }).catch(function(e){
          console.error(e);
        });
      },
    };
  },
};

lintProjectUnused = function(project, next){
  var checkUnused = require('./unused-deps');
  var path = require('path');
  var async = require('async');
  var directories = project.getDirectories();

  var ignore = [
    '.*',
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    '.idea',
    'bower_components',
  ];

  var allow = [
    '*.js',
    '*.jsx',
  ];

  var errors = [];
  async.each(directories, function(dir, eNext){
    checkUnused(dir.path, ignore, allow, function(err, unusedarray){
      if(err) return eNext(err);
      unusedarray.forEach(function(unused){
        errors.push({
          type: 'Error',
          html: `<span class='badge badge-flexible'>unused-deps</span> ${unused} is not required by any file`,
          filePath: path.join(dir.path, 'package.json'),
        });
      });

      eNext();
    });
  },

  function(err){
    console.error(err);
    next(err, errors);
  });
};

lintTextEditor = function(textEditor, next){

  var async = require('async');
  var detective = require('./detective');
  var resolve = require('resolve');
  var path = require('path');

  var errors = [];
  var done = [];
  var text = textEditor.displayBuffer.buffer.cachedText;
  var lines = void 0;
  var filePath = textEditor.getPath();
  try{
    var required = detective(text);
  }catch(e){
    return next(void 0, [e]);
  }

  async.eachSeries(required, function(name, nextItem){
    try{
      resolve.sync(name, {
        basedir: path.dirname(filePath),
      });
    }catch(err){
      if(!lines) lines = text.split(/\n/g);
      if(done.indexOf(name) > -1) return;
      done.push(name);
      var escapedId = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      var reg = new RegExp('.*require\\s*\\(.*'.concat(escapedId).concat('.*\\).*'));
      lines.forEach(function(line, lineNumber){
        if(!reg.test(line)) return;
        var colNumber = line.indexOf(name);
        if(colNumber === -1) return;
        var message = name.concat(' is missing from ').concat(filePath);
        errors.push({
          type: 'Error',
          html: `<span class='badge badge-flexible'>require</span> ${message}`,
          range: [[lineNumber, colNumber], [lineNumber, colNumber + name.length]],
          filePath: filePath,
        });
      });
    }finally{
      return setImmediate(nextItem);
    }
  },

  function(){
    next(void 0, errors);
  });
};
