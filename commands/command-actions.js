'use strict';

const Common = require('../helpers/common');
const fs = require('fs');
const DB = require('../helpers/database');

const migrationDirectory = 'migrations';
const create = require('./create');
const Up = require('./up');
const Down = require('./down');

function createAction(name, options) {
  return create(name, migrationDirectory, options.template)
    .then((value) => {
      console.log(`New migration created at ${value}`);
      process.exit(0);
    })
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
}

function upAction(options) {
  let db = new DB();
  let common = new Common(fs, db);
  return common.createMigrationTable()
    .then(common.getMigrationFiles(process.cwd() + `/${migrationDirectory}`))
    .then(() => common.getMigrations())
    .then(() => common.getMigrationSet('up', options.timestamp))
    .then((migrationLists) => {
      
      let up = new Up(db, migrationLists, migrationDirectory);

      console.log(`Processing ${Object.keys(migrationLists).length} migration(s)`);

      return up.runPending();
    });
}

function downAction(options) {
  let db = new DB();
  let common = new Common(fs, db);
  return common.createMigrationTable()
    .then(common.getMigrationFiles(process.cwd() + `/${migrationDirectory}`))
    .then(() => common.getMigrations())
    .then(() => common.getMigrationSet('down', options.timestamp))
    .then((migrationLists) => {
      let down = new Down(db, migrationLists, migrationDirectory);

      console.log(`Processing ${Object.keys(migrationLists).length} migration(s)`);

      return down.runPending();
    });
}

module.exports = {
  upAction: upAction,
  downAction: downAction,
  createAction: createAction
};
