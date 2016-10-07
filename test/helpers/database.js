'use strict';

const cassandra = require('cassandra-driver');
const tools = require('itaas-nodejs-tools');
const context = require('./context-factory')();
const queries = require('./queries');

function getTestDriverOptions() {
  let driverOptions = {
    contactPoints: (process.env.DBHOST || 'localhost').split(','),
    keyspace: 'testing_cassandra_migrate'
  };

  return driverOptions;
}

function createClient (driverOptions){
  let client = new cassandra.Client(driverOptions);
  return client;
}

function setupDatabase()
{
  let driverOptions = {
    contactPoints: (process.env.DBHOST || 'localhost').split(',')
  };
  
  let client = createClient(driverOptions);

  return tools.cassandra.cql.executeNonQuery(context, client, queries.dropKeySpace)
    .then(()=>{
      return tools.cassandra.cql.executeNonQuery(context, client, queries.createKeySpace);
    });
}

module.exports = {
  getTestDriverOptions: getTestDriverOptions,
  createClient: createClient,
  setupDatabase: setupDatabase
};
