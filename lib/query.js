module.exports = {
  select: function() {
    const query = new Query();
    query.select.apply(query, arguments);
    query._enclose = true;
    return query;
  },
  literal: function(value) {
    const query = new Query();
    query.literal(value);
    return query;
  },
  param: function(name) {
    const query = new Query();
    query.params.push(name);
    query.parts.push('?');
    return query;
  },
  as: function(name, alias) {
    const query = new Query();
    query.parts.push(query.escape(name));
    query.as(alias);
    return query;
  },
  asc: function(name) {
    const query = new Query();
    query._order = true;
    query.orderAsc(name);
    return query;
  },
  desc: function(name) {
    const query = new Query();
    query._order = true;
    query.orderDesc(name);
    return query;
  },
  count: function(id) {
    const query = new Query();
    query.function('count', query.escape(id || '*'));
    return query;
  },
  min: function(id) {
    const query = new Query();
    query.function('min', query.escape(id));
    return query;
  },
  max: function(id) {
    const query = new Query();
    query.function('max', query.escape(id));
    return query;
  },
};

function Query() {
  this.parts = [];
  this.params = [];
}

Query.prototype.literal = function(value) {
  switch (typeof value) {
    case 'boolean':
      value = value ? 'true' : 'false';
      break;
    case 'number':
      value = value.toString();
      break;
    case 'object':
      if (value == null) {
        value = 'NULL';
        break;
      }
    default:
      value = '\'' + value.toString() + '\'';
      break;
  }
  this.parts.push(value);
  return this;
}

Query.prototype.function = function(func) {
  var args = Array.prototype.slice.call(arguments, 1);
  this.parts.push(func.toUpperCase() + '(' + args.join(', ') + ')');
  return this;
};

Query.prototype.select = function() {
  this.parts.push('SELECT');
  if (!arguments.length) {
    this.parts.push('*');
  } else {
    var args = Array.prototype.slice.call(arguments);
    this.parts.push(args.map(this.escape.bind(this)).join(', '));
  }
  return this;
};

Query.prototype.as = function(name) {
  this.parts.push('AS', this.escape(name));
  return this;
};

Query.prototype.from = function(table, alias) {
  this.parts.push('FROM', this.escape(table));
  alias && this.as(alias);
  return this;
};

Query.prototype.leftJoin = function(table, alias) {
  this.parts.push('LEFT OUTER JOIN', this.escape(table));
  alias && this.as(alias);
  return this;
};

Query.prototype.rightJoin = function(table, alias) {
  this.parts.push('RIGHT OUTER JOIN', this.escape(table));
  alias && this.as(alias);
  return this;
};

Query.prototype.outerJoin = function(table, alias) {
  this.parts.push('FULL OUTER JOIN', this.escape(table));
  alias && this.as(alias);
  return this;
};

Query.prototype.join = Query.prototype.innerJoin = function(table, alias) {
  this.parts.push('INNER JOIN', this.escape(table));
  alias && this.as(alias);
  return this;
};

Query.prototype.crossJoin = function(table, alias) {
  this.parts.push('CROSS JOIN', this.escape(table));
  alias && this.as(alias);
  return this;
};

Query.prototype.on = function(field1, field2) {
  this.parts.push('ON', this.escape(field1));
  field2 && this.eq(field2);
  return this;
};

Query.prototype.where = function(field, value) {
  this.parts.push('WHERE', this.escape(field));
  value && this.eq(value);
  return this;
};

Query.prototype.groupBy = function() {
  this.parts.push('GROUP BY');
  var args = Array.prototype.slice.call(arguments);
  this.parts.push(args.map(this.escape.bind(this)).join(', '));
  return this;
};

Query.prototype.having = function(field, value) {
  this.parts.push('HAVING', this.escape(field));
  value && this.eq(value);
  return this;
};

Query.prototype.orderBy = function() {
  this.parts.push('ORDER BY');
  var args = Array.prototype.slice.call(arguments);
  this.parts.push.apply(this.parts, args.map(this.escape.bind(this)).join(', '));
  return this;
};

Query.prototype.orderDesc = function(field) {
  if (!this._order) {
    this.parts.push('ORDER BY', this.escape(field), 'DESC');
  } else {
    this.parts.push(this.escape(field), 'DESC');
  }
  return this;
};

Query.prototype.orderAsc = function(field) {
  if (!this._order) {
    this.parts.push('ORDER BY', this.escape(field), 'ASC');
  } else {
    this.parts.push(this.escape(field), 'ASC');
  }
  return this;
};

Query.prototype.limit = function(start, limit) {
  if (arguments.length < 2) {
    limit = this.escape(start);
    start = 0;
  } else {
    start = this.escape(start);
    limit = this.escape(limit);
  }
  this.parts.push('LIMIT', [start, limit].join(', '));
  return this;
};

Query.prototype.and = function(field) {
  this.parts.push('AND', this.escape(field));
  return this;
};

Query.prototype.or = function(field) {
  this.parts.push('OR', this.escape(field));
  return this;
};

Query.prototype.in = function(sub) {
  this.parts.push('IN', this.escape(sub));
  return this;
};

Query.prototype.like = function(mask) {
  this.parts.push('LIKE', this.escape(mask));
  return this;
};

Query.prototype.between = function(a, b) {
  this.parts.push('BETWEEN', typeof a == 'number' ? a : this.escape(a));
  this.parts.push('AND', typeof b == 'number' ? b : this.escape(b));
  return this;
};

Query.prototype.eq = function(value) {
  this.parts.push('=', this.escape(value));
  return this;
};

Query.prototype.gt = function(value) {
  this.parts.push('>', this.escape(value));
  return this;
};

Query.prototype.gte = function(value) {
  this.parts.push('>=', this.escape(value));
  return this;
};

Query.prototype.lt = function(value) {
  this.parts.push('<', this.escape(value));
  return this;
};

Query.prototype.lte = function(value) {
  this.parts.push('<=', this.escape(value));
  return this;
};

Query.prototype.toString = function(enclose) {
  if (enclose && this._enclose) {
    return '(' + this.parts.join(' ') + ')';
  }
  return this.parts.join(' ');
};

Query.prototype.escape = function(identifier) {
  if (identifier instanceof Query) {
    this.params.push.apply(this.params, identifier.params);
    return identifier.toString(true);
  }
  identifier = identifier.split(' ');
  if (identifier.length > 1) {
    identifier = identifier.map(this.escape.bind(this));
  } else {
    var names = identifier[0].split('.');
    names = names.map((name) => {
      if (name == '*') return name;
      return '`' + name + '`';
    });
    identifier[0] = names.join('.');
  }
  return identifier.join(' ');
};