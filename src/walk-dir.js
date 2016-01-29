'use strict';

var path = require('path');
var fs = require('fs');
var async = require('async');
var minimatch = require('minimatch');

var checkDirectory;

module.exports = checkDirectory = function(base, dirname, ignore, allow, checkFile, next){
  fs.readdir(dirname, function(err, children){
    if(err) return next(err);
    if(children.length === 0) return next(void 0, []);

    var filtered = children.filter(function(child){
      return !ignore.some(function(pattern){
        var rel = path.join(dirname, child).substring(base.length);
        if(minimatch(rel, pattern, { matchBase: true })) console.log(rel, pattern, child);
        return minimatch(rel, pattern, { matchBase: true });
      });
    });

    filtered = filtered.filter(function(child){
      return allow.some(function(pattern){
        return minimatch(path.join(dirname, child).substring(base.length), pattern, { matchBase: true });
      });
    });

    async.concat(filtered, function(child, rNext){
      var curPath = path.join(dirname, child);
      fs.stat(curPath, function(bErr, stat){
        if(bErr) return next(bErr);
        var boo = stat.isDirectory();
        if(boo){
          return checkDirectory(base, curPath, ignore, allow, checkFile, rNext);
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
