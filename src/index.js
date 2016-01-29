'use strict';

var path = require('path');
var fs = require('fs');
var util = require('./util');
var async = require('async');

var walkdir = require('./walk-dir');

var detective = require('./detective');
var resolve = require('resolve');

var runner, createMissingError, createUnusedError;

module.exports = function(directories, options, next){
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

  async.concat(directories, runner.bind(void 0, options), next);
};

runner = function(options, dir, done){
  var ignore = options.ignore;
  var allow = options.allow;

  if(options.includeGitIgnore !== false){
    try{
      ignore = ignore.concat(fs.readFileSync(path.resolve(dir, './.gitignore')).toString('utf8').split(/\n/g));
    }catch(e){
      console.error('cannot use .gitignore');
    }
  }

  var pkgtext;
  var pkgdeps;
  try{
    pkgtext = fs.readFileSync(path.join(dir, 'package.json')).toString('utf-8');
    var pkg;
    try{
      pkg = JSON.parse(pkgtext);
    }catch(e){
      return done(e);
    }

    pkgdeps = Object.keys(pkg.dependencies);
    if(options.checkDev){
      pkgdeps = pkgdeps.concat(Object.keys(pkg.devDependencies));
    }
  }catch(e){
    pkgdeps = [];
  }

  walkdir(dir, dir, ignore, allow, function(curPath, doNext){
    fs.readFile(curPath, function(err, content){
      if(err) return doNext(err);
      var text = content.toString('utf8');
      var founddeps;
      try{
        founddeps = detective(text);
      }catch(e){
        return doNext([e]);
      }

      var lines;
      var finished = [];

      var errs = founddeps.reduce(function(missing, dep){
        if(finished.indexOf(dep) !== -1) return missing;
        finished.push(dep);
        pkgdeps = pkgdeps.filter(function(pkgdep){
          return founddeps.indexOf(pkgdep) === -1;
        });

        try{
          resolve.sync(dep, {
            basedir: path.dirname(curPath),
          });
          return missing;
        }catch(e){
          if(!lines) lines = text.split(/\n/g);
          return missing.concat(createMissingError(dir, curPath, lines, dep));
        }
      }, []);

      doNext(void 0, errs);
    });
  },

  function(err, errors){
    if(err) return done(err);
    if(!pkgdeps.length) return done(void 0, errors);
    var lines = pkgtext.split(/\n/g);
    var pkgpath = path.join(dir, 'package.json');
    done(void 0, errors.concat(pkgdeps.map(createUnusedError.bind(void 0, pkgpath, lines))));
  });
};

createMissingError = function(dir, filePath, lines, name){
  var escapedId = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  var reg = new RegExp('.*require\\s*\\(.*'.concat(escapedId).concat('.*\\).*'));
  var message = name.concat(' is missing from ').concat(filePath.substring(dir.length));
  return util.findLineAndCol(lines, reg, name).map(function(linecol){
    return {
      name: 'missing-dep',
      message: message,
      filename: filePath,
      location: linecol,
    };
  });
};

createUnusedError = function(filePath, lines, unused){
  var name = `\"${unused}\"`;
  var pattern = new RegExp('.*[^\\\\]'.concat(name).concat('\\s*\\:.*'));

  return {
    name: 'unused-dep',
    message: `${unused} has been installed but is not required by any file`,
    filename: filePath,
    location: util.findLineAndCol(lines, pattern, name)[0],
  };
};
