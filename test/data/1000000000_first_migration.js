'use strict';

const tools = require('itaas-nodejs-tools');
const uuid = require('uuid').v4;
const queries = require('../test/helpers/queries');

let config = {};
let logger = tools.createLogger({logOutput: 'rotating-file', logDirectory: 'logs/migration'});
let serviceLocator = tools.createServiceLocator();
let context = tools.createCallContext(uuid(), config, logger, serviceLocator);

const migration = {
  up : function (db, handler) {
    let query = queries.firstMigrationUp;
    let params = [];

    tools.cassandra.cql.executeNonQuery(context, db, query, params)
      .then ((result)=>{
        handler(false, true);
      })
      .catch((err)=>{
        handler(err, false);
      });
  },
  down : function (db, handler) {
    let query = queries.firstMigrationDown;
    let params = [];
    
    tools.cassandra.cql.executeNonQuery(context, db, query, params)
      .then ((result)=>{
        handler(false, true);
      })
      .catch((err)=>{
        handler(err, false);
      });

    db.execute(query, params, { prepare: true }, function (err) {
      if (err) {
        handler(err, false);
      } else {
        handler(false, true);
      }
    });
  }
};

module.exports = migration;
