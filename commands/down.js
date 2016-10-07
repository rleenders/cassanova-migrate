'use strict';
const async = require('async');
const migration_settings = require('../scripts/migrationSettings.json');
const path = require('path');

class down {
  constructor(db, pendingMigrations, directory) {
    this.db = db;
    this.directory = directory;
    this.pending = pendingMigrations;
    this.keyList = Object.keys(pendingMigrations).sort(function (a, b) {
      return b - a;
    });
  }

  runPending() {
    return new Promise((resolve, reject) => {
      async.eachSeries(this.keyList, (id, callback) => {
        let fileName = this.pending[ id ];
        let attributes = fileName.split('_');
        let query = {
          'file_name': fileName, 'migration_number': attributes[ 0 ], 'title': fileName.replace('.js', ''),
          'run': require(path.resolve(process.cwd() + `/${this.directory}/` + fileName))
        };
        this.run(query)
          .then((query) => this.updateMigrationTable(query))
          .then((result) => callback(null, result))
          .catch((error) => callback(error));
      }, (err) => {
        if (err) {
          reject(`Error Rolling Back Migrations: ${err}`);
        } else {
          resolve('All Migrations Rolled Back Successfully');
        }
      });

    });
  }

  run(query) {
    return new Promise((resolve, reject) => {
      console.log(`  Rolling back changes: ${query.title}`);
      let db = this.db;
      query.run.down(db, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(query);
        }
      });
    });
  }

  updateMigrationTable(query) {
    return new Promise((resolve, reject) => {
      let db = this.db;
      delete query.run;
      delete query.migration_number;
      delete query.title;
      db.execute(migration_settings.deleteMigration, query, { prepare: true }, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(`Successfully Rolled Back ${query.title}`);
        }
      });
    });
  }

}

module.exports = down;