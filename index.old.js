'use strict';

module.exports = {
  activate: function(){
    console.log('activate linter-mdeps');
  },
  provideLinter: function(){
    var core = [
      'events',
      'buffer',
      'util',
      'dns',
      'dgram',
      'http',
      'https',
      'net',
      'fs',
      'child_process',
      'stream',
      'path'
    ];
    var mdeps = require('module-deps');
    var fs = require('fs');
    var bresolve = require('browser-resolve');
    // var resolvePath = function(id, par, cb){
    //   var netPath = path.resolve(par.filename, id);
    //   console.log(netPath);
    //   bresolve(id, par, function(err, t, pkg){
    //     if(!err) cb(null, t, pkg);
    //     try{
    //       t = require.resolve(null, netPath);
    //       return cb(null, require.resolve(null, netPath));
    //     }catch(e){
    //       cb(e);
    //     }
    //   });
    // };

    var resolveFilter = function(id){
      if(core.indexOf(id) > -1) return false;
      if(/^\.{0,}\/.*/.test(id)) return true;
      return true;
    };

    console.log('providingLinter');
    return {
      showErrorInline: true,
      name: 'MDEPS',
      grammarScopes: ['source.js'],
      scope: 'file',
      lintOnFly: false,
      lint: function(textEditor){
        console.log(textEditor);
        return new Promise(function(resolve){
          var missing = [];
          var curPath = textEditor.getPath();
          mdeps({
            ignoreMissing: true,
            resolve: bresolve,
            filter: resolveFilter
          }).on('missing', function(id, parent){
            console.log('missing');
            missing.push([id, parent]);
          }).on('error', function(err){
            console.log('errored', err);
            setImmediate(function(){
              resolve(missing);
            });
          }).on('finish', function(){
            console.log('finished');
            resolve(missing);
          }).end({ file: curPath });
        }).then(function(missing){
          return missing.reduce(function(errors, objs){
            var id = objs[0];
            var parent = objs[1];
            var escapedId = id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var reg = new RegExp('.*require\\s*\\(.*' + escapedId + '.*\\).*');
            fs.readFileSync(parent.filename, 'utf8')
            .split(/\n/g).forEach(function(line, lineNumber){
              if(!reg.test(line)) return;
              var colNumber = line.indexOf(id);
              if(colNumber === -1) return;
              var message = id + ' is missing from ' + parent.filename;
              errors.push({
                type: 'Error',
                html: `<span class='badge badge-flexible'>require</span> ${message}`,
                range: [[lineNumber, colNumber], [lineNumber, colNumber + id.length]],
                filePath: parent.filename
              });
            });
            return errors;
          }, []);
        }).then(function(errors){
          console.log(errors);
          return errors;
        });
      }

    };
  }
};
