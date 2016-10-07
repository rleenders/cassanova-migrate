#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs');

const actions = require('./commands/command-actions');

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
  '  cassandra-migrate <up/down> -t <migration_timestamp>.',
  '(Runs cassandra migrations UP or DOWN to a particular migration timestamp).',
  '',
  '  cassandra-migrate create <migration_name>. (Creates a new cassandra migration)',
  '',
  '  cassandra-migrate create <migration_name> -t <template>',
  '(Creates a new cassandra migrate but uses a specified template instead of default).',
  ''

].join('\n');

program.on('--help', function () {
  console.log(usage);
});

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version);

program.name = 'cassandra-migrate';

program
  .command('create <name>')
  .description('initialize a new migration file with title.')
  .option('-t, --template "<template>"', 'sets the template for create')
  .action((name, options) => {
    return actions.createAction(name, options)
      .then(result => {
        console.log(result);
        process.exit(0);
      })
      .catch(error => {
        console.log(error);
        process.exit(1);
      });
  });

program
  .command('up')
  .description('run pending migrations')
  .option('-t, --timestamp "<number>"', 'run migrations up to a specified migration timestamp')
  .action((options) => {
    return actions.upAction(options)
      .then(result => {
        console.log(result);
        process.exit(0);
      })
      .catch(error => {
        console.log(error);
        process.exit(1);
      });
  });

program
  .command('down')
  .description('roll back already run migrations')
  .option('-t, --timestamp "<number>"', 'rollback migrations down to a specified migration timestamp')
  .action((options) => {
    return actions.downAction(options)
      .then(result => {
        console.log(result);
        process.exit(0);
      })
      .catch(error => {
        console.log(error);
        process.exit(1);
      });
  });

program.parse(process.argv);
