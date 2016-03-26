'use strict';

module.exports = function(opts) {
  opts = opts || {};
  opts.engine = new (require('./lib/db/' + (opts.engine || 'sqlite3')))(opts);
  return opts.engine;
};

exports.Query = require('./lib/query');