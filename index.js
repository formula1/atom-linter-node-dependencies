'use strict';

module.exports = {
  activate: function(){
    console.log('activate linter-module-dependencies');
  },
  provideLinter: function(){
    var detective = require('./detective');
    var resolve = require('resolve');
    var path = require('path');

    return {
      showErrorInline: true,
      name: 'module-dependencies',
      grammarScopes: ['source.js'],
      scope: 'file',
      lintOnFly: false,
      lint: function(textEditor){
        var errors = [];
        var done = [];
        var text = textEditor.displayBuffer.buffer.cachedText;
        var lines = void 0;
        var filePath = textEditor.getPath();
        var required = detective(text);
        required.forEach(function(name){
          try{
            resolve.sync(name, {
              basedir: path.dirname(filePath)
            });
          }catch(err){
            if(!lines) lines = text.split(/\n/g);
            if(done.indexOf(name) > -1) return;
            done.push(name);
            var escapedId = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var reg = new RegExp('.*require\\s*\\(.*' + escapedId + '.*\\).*');
            lines.forEach(function(line, lineNumber){
              if(!reg.test(line)) return;
              var colNumber = line.indexOf(name);
              if(colNumber === -1) return;
              var message = name + ' is missing from ' + filePath;
              errors.push({
                type: 'Error',
                html: `<span class='badge badge-flexible'>require</span> ${message}`,
                range: [[lineNumber, colNumber], [lineNumber, colNumber + name.length]],
                filePath: filePath
              });
            });
          }
        });
        return errors;
      }

    };
  }
};
