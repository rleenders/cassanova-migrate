#!/usr/bin/env node
/*jslint node: true */
"use strict";

var program = require('commander');
var Common = require('./util/common');
var fs = require('fs');
var DB = require('./util/database');
const Helpers = require ('./util/helpers');

/**
 * Usage information.
 */

var usage = [
  '',
  '  example : ',
  '',
  '  cassandra-migrate <command> [options]',
  '',
  '  cassandra-migrate up -k <keyspace> (Runs All pending cassandra migrations)',
  '',
  '  cassandra-migrate down -k <keyspace> (Rolls back a single cassandra migration)',
  '',
  '  cassandra-migrate <up/down> -n <migration_number>. (Runs cassandra migrations UP or DOWN to a particular migration number).',
  '',
  '  cassandra-migrate <up/down> -k <keyspace> -s <migration_number> (skips a migration, either adds or removes the migration from the migration table)',
  '',
  '  cassandra-migrate create <migration_name>. (Creates a new cassandra migration)',
  '',
  '  cassandra-migrate create <migration_name> -t <template> (Creates a new cassandra migrate but uses a specified template instead of default).',
  '',

].join('\n');

program.on('--help', function () {
  console.log(usage);
});

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version)
  .option('-k, --keyspace "<keyspace>"', "The name of the keyspace to use.")
  .option('-H, --hosts "<host,host>"', "Comma seperated host addresses. Default is [\"localhost\"].")
  .option('-u, --username "<username>"', "database username")
  .option('-p, --password "<password>"', "database password")
  .option('-o, --optionFile "<pathToFile>"', "pass in a javascript option file for the cassandra driver, note that certain option file values can be overridden by provided flags")
;

program.name = 'cassandra-migrate';

program
  .command('create <title>')
  .description('initialize a new migration file with title.')
  .option('-t, --template "<template>"', "sets the template for create")
  .action((title, options) => {
    let Create = require('./commands/create');
    let create = new Create(fs, options.template, Helpers.getDir(options));
    create.newMigration(title);
    process.exit(0);
  });

program
  .command('up')
  .description('run pending migrations')
  .option('-n, --num "<number>"', 'run migrations up to a specified migration number')
  .option('-s, --skip "<number>"', "adds the specified migration to the migration table without actually running it", false)
  .action((options) => {
    let db = new DB(program);
    let common = new Common(fs, db);
    const dir = Helpers.getDir(options);
    common.createMigrationTable()
      .then(common.getMigrationFiles(dir))
      .then(() => common.getMigrations())
      .then(() => common.getMigrationSet('up', options.num))
      .then((migrationLists) => {
        let Up = require('./commands/up');
        let up = new Up(db, migrationLists, dir);
        if (!options.skip) {
          console.log('processing migration lists');
          console.log(migrationLists);
        }
        up.runPending(options.skip)
          .then(result => {
            console.log(result);
            process.exit(0);
          }, error => {
            console.log(error);
            process.exit(1);
          });
      })
      .catch(error => {
        console.log(error);
        process.exit(1);
      });

  });

program
  .command('down')
  .description('roll back already run migrations')
  .option('-n, --num "<number>"', 'rollback migrations down to a specified migration number')
  .option('-s, --skip "<number>"', "removes the specified migration from the migration table without actually running it", false)
  .action((options) => {
    let db = new DB(program);
    let common = new Common(fs, db);
    const dir = getDir(program);
    common.createMigrationTable()
      .then(common.getMigrationFiles(dir))
      .then(() => common.getMigrations())
      .then(() => common.getMigrationSet('down', options.num))
      .then((migrationLists) => {
        console.log('processing migration lists');
        let Down = require('./commands/down');
        let down = new Down(db, migrationLists);
        if (!options.skip) {
          console.log('processing migration lists');
          console.log(migrationLists);
        }
        down.runPending(options.skip)
          .then(result => {
            console.log(result);
            process.exit(0);
          }, error => {
            console.log(error);
            process.exit(1);
          });
      })
      .catch(error => {
        console.log(error);
        process.exit(1);
      });
  });

  
/*
 //@TODO: add this functionality  so that a cql client isn't directly required
 program
 .command('run')
 .description('run cql directly')
 .option('-f, --files', 'run cql commands from file', true)
 .action(function(options){
 var Run = new require('../commands/run')(options);
 Run.cql();
 process.exit(0);
 });
 */
program.parse(process.argv);
