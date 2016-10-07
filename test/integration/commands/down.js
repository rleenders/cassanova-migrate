'use strict';
/* global describe,it,beforeEach */
const should = require('should'); // eslint-disable-line no-unused-vars
const actions = require('../../../commands/command-actions');
const migrationFiles = require('../../helpers/migration-files');
const tools = require('itaas-nodejs-tools');
const uuid = require('uuid').v4;
const queries = require('../../helpers/queries');
const databaseHelper = require('../../helpers/database');

let config = {};
let logger = tools.createLogger({logOutput: 'rotating-file', logDirectory: 'logs/test'});
let serviceLocator = tools.createServiceLocator();
let context = tools.createCallContext(uuid(), config, logger, serviceLocator);

describe('Down', function () {
  beforeEach(function (){
    migrationFiles.move();
    process.env.DBHOST = 'localhost';
    process.env.DBKEYSPACE = 'testing_cassandra_migrate';

    return databaseHelper.setupDatabase();
  });

  it('should run all migrations down', function () {
    let options = {};
    
    return actions.upAction(options)
      .then((result)=>{
        return actions.downAction(options);
      })
      .then((result)=>{        
        let client = databaseHelper.createClient(databaseHelper.getTestDriverOptions());

        return tools.cassandra.cql.executeQuery(
          context,
          client,
          queries.getMigrationWithFileName,
          {fileName: '1000000000_first_migration.js'});
      })
      .then((result)=>{
        result.should.have.length(0);
      });
  });

  it('should run until target', function () {
    let options = {};
    
    return actions.upAction(options)
      .then((result)=>{
        let downOptions = {timestamp: '1000000001'};
        return actions.downAction(downOptions);
      })
      .then((result)=>{        
        let client = databaseHelper.createClient(databaseHelper.getTestDriverOptions());

        return tools.cassandra.cql.executeQuery(
          context,
          client,
          queries.getMigrationWithFileName,
          {fileName: '1000000000_first_migration.js'});
      })
      .then((result)=>{
        result.should.have.length(1);
        result[0].file_name.should.be.equal('1000000000_first_migration.js');
        result[0].migration_number.should.be.equal('1000000000');
        result[0].title.should.be.equal('1000000000_first_migration');
      });
  });
});
