'use strict';
const async = require('async');
const migration_settings = require('../scripts/migrationSettings.json');
const path = require('path');

class Up {
  constructor(db, pendingMigrations, directory) {
    this.db = db;
    this.directory = directory;
    this.pending = pendingMigrations;
    this.keyList = Object.keys(pendingMigrations).sort(function (a, b) {
      return a - b;
    });
  }

  runPending() {
    return new Promise((resolve, reject) => {
      async.eachSeries(this.keyList, (id, callback) => {
        let fileName = this.pending[ id ];
        let attributes = fileName.split('_');

        let query = {
          'file_name': fileName,
          'migration_number': attributes[ 0 ],
          'title': fileName.replace('.js', ''),
          'run': require(path.resolve(process.cwd() + `/${this.directory}/` + fileName))
        };
        this.run(query)
          .then((query) => this.updateMigrationTable(query))
          .then((result) => callback(null, result))
          .catch((error) => callback(error));

      }, (err) => {
        if (err) {
          reject(`Error Running Migrations: ${err}`);
        } else {
          resolve('All Migrations Ran Successfully');
        }
      });

    });
  }

  run(query) {
    return new Promise((resolve, reject) => {
      console.log(`  Migrating changes: ${query.title}`);
      let db = this.db;
      query.run.up(db, function (err) {
        if (err) {
          reject(`Failed to run migration ${query.title}: ${err}`);
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
      query.created_at = Date.now();
      db.execute(migration_settings.insertMigration, query, { prepare: true }, function (err) {
        if (err) {
          reject(`Failed to write migration to Migrations Table: ${query.title}: ${err}`);
        } else {
          resolve(`Successfully Migrated ${query.title}`);
        }
      });
    });
  }


}

module.exports = Up;