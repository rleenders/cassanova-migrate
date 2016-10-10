'use strict';

const cassandra = require('cassandra-driver');

class Database {
  constructor() {
    this.driverOptions = {
      contactPoints: (process.env.DBHOST || 'localhost').split(','),
      keyspace: process.env.DBKEYSPACE
    };
    
    let username = process.env.DBUSER;
    let password = process.env.DBPASSWORD;

    if (username && password) {
      this.driverOptions.authProvider = new cassandra.auth.PlainTextAuthProvider(username, password);
    }

    let client = new cassandra.Client(this.driverOptions);

    return client;
  }
}

module.exports = Database;
