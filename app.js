#!/usr/bin/env node
/*jslint node: true */
"use strict";

const program = require('commander');
const Common = require('./util/common');
const fs = require('fs');
const DB = require('./util/database');

const migrationDirectory = 'migrations';
const create = require('./commands/create');

const usage = [
  '',
  '  Examples: ',
  '',
  '  cassandra-migrate <command> [options]',
  '',
  '  cassandra-migrate up -k <keyspace> (Runs All pending cassandra migrations)',
  '',
  '  cassandra-migrate down -k <keyspace> (Rolls back a single cassandra migration)',
  '',
  '  cassandra-migrate <up/down> -n <migration_number>. (Runs cassandra migrations UP or DOWN to a particular migration number).',
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
  .option('-o, --optionFile "<pathToFile>"', "pass in a javascript option file for the cassandra driver, note that certain option file values can be overridden by provided flags");

program.name = 'cassandra-migrate';

program
  .command('create <name>')
  .description('initialize a new migration file with title.')
  .option('-t, --template "<template>"', "sets the template for create")
  .action((title, options) => {
    create(name, options.template, migrationDirectory)
      .then((value) => {
        process.exit(0);
      })
      .catch((err) => {
        console.log(err);
        process.exit(1);
      });
  });

program
  .command('up')
  .description('run pending migrations')
  .option('-t, --timestamp "<number>"', 'run migrations up to a specified migration timestamp')
  .action((options) => {
    let db = new DB(program);
    let common = new Common(fs, db);
    common.createMigrationTable()
      .then(common.getMigrationFiles(process.cwd() + `/${migrationDirectory}`))
      .then(() => common.getMigrations())
      .then(() => common.getMigrationSet('up', options.timestamp))
      .then((migrationLists) => {
        let Up = require('./commands/up');
        let up = new Up(db, migrationLists, migrationDirectory);

        console.log('processing migration lists');
        console.log(migrationLists);

        up.runPending()
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
  .action((options) => {
    let db = new DB(program);
    let common = new Common(fs, db);
    common.createMigrationTable()
      .then(common.getMigrationFiles(process.cwd() + `/${migrationDirectory}`))
      .then(() => common.getMigrations())
      .then(() => common.getMigrationSet('down', options.num))
      .then((migrationLists) => {
        console.log('processing migration lists');
        let Down = require('./commands/down');
        let down = new Down(db, migrationLists, migrationDirectory);

        console.log('processing migration lists');
        console.log(migrationLists);

        down.runPending()
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

program.parse(process.argv);
