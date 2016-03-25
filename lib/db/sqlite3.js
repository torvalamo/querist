'use strict';

const Querist = require('../querist');
const sqlite3 = require('sqlite3');
const util    = require('util');

module.exports = function DB(opts) {
  Querist.call(this, opts);
  if (opts.verbose) {
    sqlite3.verbose();
  }
  var mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
  if (opts.mode) {
    mode = 0;
    if (~opts.mode.search(/rw/)) {
      mode |= sqlite3.OPEN_READWRITE;
    } else if (~opts.mode.search(/r/)) {
      mode |= sqlite3.OPEN_READONLY;
    }
    if (~opts.mode.search(/c/)) {
      mode |= sqlite3.OPEN_CREATE;
    }
  }
  this.db = new sqlite3.Database(opts.path, mode, (err) => {
    if (err) throw err;
  });
}

util.inherits(DB, Querist);

DB.prototype.prepare = function(name, query, cb) {
  if (typeof query == 'undefined') {
    query = name;
    name = null;
  }
  
  const stmt = new Statement(this.db, this.db.prepare(query.toString(), (err) => {
    if (err) throw err;
    cb();
  }), query.params);
  name && this._prepare(name, stmt);
  return stmt;
};

DB.prototype.statement = function(name, params) {
  const stmt = this._statement(name);
  return stmt;
};

/**
 * Sqlite3 query delegates.
**/

DB.prototype.all = function(query, cb) {
  this.db.all(query.toString(), (err, res) => {
    if (err) throw err;
    cb(res);
  });
};

DB.prototype.each = function(query, cb, complete) {
  this.db.each(query.toString(), (err, res) => {
    if (err) throw err;
    cb(res);
  }, complete);
};

DB.prototype.get = function(query, cb) {
  this.db.get(query.toString(), (err, res) => {
    if (err) throw err;
    cb(res);
  });
};

DB.prototype.run = function(query, cb) {
  this.db.run(query.toString(), function(err) => {
    if (err) throw err;
    cb && cb(this.lastID, this.changes);
  });
};

DB.prototype.exec = function(query, opts, cb) {
  if (arguments.length < 3 && typeof opts == 'function') {
    cb = opts;
    opts = {};
  }
  
  opts = opts || {};
  opts.clean = typeof opts.clean == 'undefined' ? true : opts.clean;
  
  // Clean out simple sql comments. 
  // Will cause the query to fail if '--' is used inside strings in the sql.
  if (opts.clean) query = query.toString().replace(/\-\-.*?$/mg, '');
  
  if (opts.transact) {
    query = 'BEGIN TRANSACTION;' + query + ';END TRANSACTION;';
  }
  
  this.db.exec(query, (err) => {
    if (err) throw err;
    cb && cb();
  });
};

/**
 * Sqlite3 statement delegates.
**/

function Statement(db, stmt, params) {
  Querist.Statement.call(this, stmt, params);
  this.db = db;
}

util.inherits(Statement, Querist.Statement);

Statement.prototype.all = function() {
  this.stmt.all.apply(this.stmt, arguments);
};

Statement.prototype.each = function() {
  this.stmt.each.apply(this.stmt, arguments);
};

Statement.prototype.get = function() {
  this.stmt.get.apply(this.stmt, arguments);
};

Statement.prototype.run = function() {
  const args = Array.prototype.slice.call(arguments);
  const cb = args.pop();
  args.push(function(err) {
    cb(err, this);
  });
  this.stmt.run.apply(this.stmt, args);
};