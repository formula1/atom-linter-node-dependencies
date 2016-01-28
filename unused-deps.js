'use strict';

var path = require('path');
var fs = require('fs');
var async = require('async');
var minimatch = require('minimatch');

var checkDirectory, checkFile;

module.exports = function(dir, ignore, allow, next){

  checkDirectory(dir, dir, ignore, allow, function(err, deps){
    if(err) return next(err);
    var pkg;
    try{
      pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json')));
    }catch(e){
      return next(e);
    }

    next(void 0, Object.keys(pkg.dependencies).filter(function(dep){
      return deps.indexOf(dep) === -1;
    }));
  });
};

checkDirectory = function(base, dirname, ignore, allow, next){
  fs.readdir(dirname, function(err, children){
    if(err) return next(err);
    var filtered = children.filter(function(child){
      return !ignore.some(function(pattern){
        var rel = path.relative(base, path.join(dirname, child));
        return minimatch(rel, pattern, { matchBase: true });
      });
    });

    filtered = filtered.filter(function(child){
      return allow.some(function(pattern){
        var rel = path.relative(base, path.join(dirname, child));
        return minimatch(rel, pattern, { matchBase: true });
      });
    });

    async.concat(filtered, function(child, rNext){
      var curPath = path.join(dirname, child);
      fs.stat(curPath, function(bErr, stat){
        if(bErr) return next(bErr);
        var boo = stat.isDirectory();
        if(boo){
          return checkDirectory(base, curPath, ignore, rNext);
        }else{
          checkFile(curPath, rNext);
        }
      });
    },

    function(rErr, ari){
      if(rErr) return next(rErr);
      next(void 0, ari);
    });
  });
};

var detective = require('./detective');
var path = require('path');

checkFile = function(curPath, next){
  fs.readFile(curPath, function(err, content){
    if(err) return next(err);
    var text = content.toString('utf8');
    try{
      next(void 0, detective(text));
    }catch(e){
      next(e);
    }
  });
};
