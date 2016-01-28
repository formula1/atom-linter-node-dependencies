'use strict';

module.exports.toAtomError = function(error){
  return {
    type: 'Error',
    html: `<span class='badge badge-flexible'>${error.name}</span> ${error.message}`,
    range: error.location,
    filePath: error.filename,
  };
};

module.exports.findLineAndCol = function(lines, pattern, name){
  var ret = [];
  lines.forEach(function(line, lineNumber){
    if(!pattern.test(line)) return;
    var colNumber = line.indexOf(name);
    if(colNumber === -1) return;

    ret.push([
      [lineNumber, colNumber],
      [lineNumber, colNumber + name.length],
    ]);
  });

  return ret;
};
