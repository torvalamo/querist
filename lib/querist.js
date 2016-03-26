'use strict';

const assign = require('node-assign');
const Query = require('./query');

function Querist(opts) {
  this.opts = opts;
  this._stmts = {};
}

module.exports = Querist;

assign(Querist.prototype, Query);

Querist.Query = Query;

Querist.prototype._prepare = function(name, statement) {
  if (name in this._stmts) {
    throw new Error('Prepared statement name taken: ' + name);
  }
  this._stmts[name] = statement;
}

Querist.prototype._statement = function(name) {
  return this._stmts[name];
}

Querist.prototype.sub = function(name) {
  return this._stmts[name]._query;
}

function Statement(stmt, query) {
  this._query = query;
  this._stmt = stmt;
  this.params = query.params || [];
}

Querist.Statement = Statement;

// Validate parameters and return an array of values in correct order.
Statement.prototype._params = function(params) {
  const missing = this.params.filter((key) => {
    console.log(key, params);
    return !(key in params);
  });
  if (missing.length) {
    throw new Error('Missing named parameters: ' + missing.toString());
  }
  return this.params.map((key) => {
    return params[key];
  });
};

Statement.prototype.bind = function(params) {
  params = this._params(params);
  return {
    all: (cb) => {
      params.push((err, res) => {
        if (err) throw err;
        cb(res);
      });
      this.all.apply(this, params);
    },
    each: (cb, complete) => {
      params.push((err, res) => {
        if (err) throw err;
        cb(res);
      }, complete);
      this.each.apply(this, params);
    },
    get: (cb) => {
      params.push((err, res) => {
        if (err) throw err;
        cb(res);
      });
      this.get.apply(this, params);
    },
    run: (cb) => {
      params.push((err, res) => {
        if (err) throw err;
        cb && cb(res);
      });
      this.run.apply(this, params);
    }
  };
};