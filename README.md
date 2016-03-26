# querist

![node version](http://img.shields.io/node/v/querist.svg)
[![npm version](https://badge.fury.io/js/querist.svg)](https://badge.fury.io/js/querist)
[![Build Status](https://travis-ci.org/torvalamo/querist.svg?branch=master)](https://travis-ci.org/torvalamo/querist)

Intuitive SQL query builder and homogenous database interface.

Currently only supports sqlite3 (mysql & postgres planned).


## Use

    npm install querist

Then in your node project

    const db = require('querist')({
      engine: 'sqlite3', // optional, default sqlite3
      verbose: false,    // optional, default false
      path: ':memory:',  // required if sqlite3
      mode: 'rwc',       // optional, default 'rwc' (r = readonly, rw = readwrite, c = create)
    });

The query builder can be used independently from the database interface, but to use prepared statements and some other things, an interface is necessary. You can get only the query builder like so:

    const qb = require('querist').Query;
    
    const query = qb.select(...).morestuffhere
    
    myDB.run(query.toString()) // the toString() function formats the query properly.

But you don't have to do this. It is also inherited into the previously declared `db` object.

For the querybuilder API, see the wiki on the github project page. This file only includes database interface functions for quick reference.

### Disclaimer

All functions below throw on error, and callbacks only return actual results. Might change this behavior with an option later.
    
### Static queries

These are queries that don't require prepared statements. You run them directly on the `db` object.

#### db.all(query, callback(rows))

Return all rows found by the query.

#### db.each(query, callback(row), [complete])

Return each row found by the query. The callback is called once for every row.

When every row has been handled, the `complete` callback is called.

#### db.get(query, callback(row))

Return only the first row found by the query.

#### db.run(query, [callback(lastID, changes)])

Run the query and call callback with EITHER `lastID` OR `changes`, reflecting the last inserted auto_increment or the number of affected rows, respectively. The other value is `undefined`.

#### db.exec(query, [options], [callback])

Executes several queries (separated by `;`) in one go.

Options are

- `clean` *boolean* - Default `true`. Whether to remove sql comments (required for at least sqlite3 to not choke). Useful if executing a large table definition file (which usually has comments). Currently this only looks for `--` and removes anything following on the same line. This means that if there is '--' present inside string literals, the query will be broken. Don't put '--' inside definition files, man. If you absolutely need to, then disable this option and remove all comments manually.
- `transact` *boolean*  - Default `false`. Whether to wrap the queries as a complete transaction. If one of the queries fail, then all of them will be reverted.

### Prepared statements

#### db.prepare([name], query, [callback])

Create (and return) a prepared statement, optionally save it with a name for easy access through `db.statement(name)`. The callback is called when the engine has confirmed that the statement is created.

    db.prepare('test', 
      db.select()
        .from('testers')
        .where('id').eq(db.param('id')) 
        // or .where('id', db.param('id')) shorthand for .eq()
    );

#### db.statement(name)

Return the statement saved by the given name.

### Statements

Statement objects are returned by `db.prepare()` or `db.statement()`. See above.

#### statement.params

Contains an array of named parameters in the order they appear in the statement.

#### statement.bind(params)

Bind the parameters given in the `params` object to the statement and return an interface for executing the statement with these parameters.

    db.statement('test').bind({id: 54}).get((row) => {...})

Does not actually communicate with the engine, it just buffers the params and binds them later. It is a pure convenience/cosmetic function. Which should be used.

#### interface.all(callback(rows))
#### statement.all([params...], [callback(err, rows)])

Return all rows found by executing the statement, or an empty array.

The second (raw) version requires you to supply all parameters IN ORDER as separate arguments, since they have not been bound to an interface by `statement.bind`. Note also that the callback signature is not the same.

#### interface.each(callback(row), [complete])
#### statement.each([params...], [callback(err, row)}, [complete]])

Return each row found by the query. The callback is called once for every row found.

When every row has been handled, the `complete` callback is called.

The second (raw) version requires you to supply all parameters IN ORDER as separate arguments, since they have not been bound to an interface by `statement.bind`. Note also that the callback signature is not the same.

#### interface.get(callback(row))
#### statement.get([params...], [callback(err, row)])

Return only the first row found by the query, or `undefined` if nothing was found.

The second (raw) version requires you to supply all parameters IN ORDER as separate arguments, since they have not been bound to an interface by `statement.bind`. Note also that the callback signature is not the same.

#### interface.run([callback(lastID, changes)])
#### statement.run([params...], [callback(err)])

Run the query and call callback with EITHER `lastID` OR `changes`, reflecting the last inserted auto_increment or the number of affected rows, respectively. N/A values are `undefined`.

The second (raw) version requires you to supply all parameters IN ORDER as separate arguments, since they have not been bound to an interface by `statement.bind`. Note also that the callback signature is not the same. In the raw callback, `this` contains `this.lastID` or `this.changes`.