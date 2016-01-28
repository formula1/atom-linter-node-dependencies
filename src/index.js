'use strict';

var util = require('./util');
var async = require('async');
var detective = require('./detective');
var resolve = require('resolve');
var checkUnused = require('./unused-deps');
var fs = require('fs');
var path = require('path');

module.exports.lintProjectUnused = function(directories, options, next){
  if(!(directories instanceof Array)) directories = [directories];
  if(!next){
    next = options;
    options = {};
  }

  options.ignore = options.ignore || [
    '.*',
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    '.idea',
    'bower_components',
  ];

  options.allow = options.allow || [
    '*.js',
    '*.jsx',
    '!*.*',
  ];

  options.checkDev = options.checkDev || false;

  var errors = [];
  async.each(directories, function(dir, eNext){
    try{
      var json = fs.readFileSync(path.join(dir, 'package.json')).toString('utf-8');
    }catch(e){
      return eNext();
    }

    var lines = json.split('\n');

    checkUnused(json, dir, options, function(err, unusedarray){
      if(err) return eNext(err);
      unusedarray.forEach(function(unused){
        var name = `\"${unused}\"`;
        var pattern = new RegExp('.*[^\\\\]'.concat(name).concat('\\s*\\:.*'));
        errors.push(
          {
            name: 'unused-dep',
            message: unused,
            filename: path.join(dir, 'package.json'),
            location: util.findLineAndCol(lines, pattern, name)[0],
          }
        );
      });

      eNext();
    });
  },

  function(err){
    next(err, errors);
  });
};

module.exports.lintTextEditor = function(text, filePath, next){

  var errors = [];
  var done = [];
  var lines = void 0;
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
      var message = name.concat(' is missing from ').concat(filePath);
      util.findLineAndCol(lines, reg, name).forEach(function(linecol){
        errors.push({
          name: 'missing-dep',
          message: message,
          filename: filePath,
          location: linecol,
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
