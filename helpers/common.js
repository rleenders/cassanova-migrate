'use strict';

const migration_settings = require('../scripts/migrationSettings.json');

class Common {
  constructor(fs, db) {
    this.db = db;
    this.fs = fs;
    this.reFileName = /^[0-9]{10}_[a-z0-9\_]*.js$/i;
  }

  createMigrationTable() {
    return new Promise((resolve, reject) => {
      this.db.execute(migration_settings.createMigrationTable, null, { prepare: true }, function (err, response) {
        if (err) {
          reject(err);
        }
        resolve(response);
      });
    });
  }

  getMigrations() {
    return new Promise((resolve, reject) => {
      this.filesRan = {};
      let self = this;
      this.db.execute(migration_settings.getMigration, null, { prepare: true }, function (err, alreadyRanFiles) {
        if (err) {
          reject(err);
        } else {
          let filesRan = {};
          for (let i = 0; i < alreadyRanFiles.rows.length; i++) {
            filesRan[ alreadyRanFiles.rows[ i ].migration_number ] = (alreadyRanFiles.rows[ i ].file_name);
          }
          self.filesRan = filesRan;
          resolve(filesRan);
        }
      });
    });
  }

  getMigrationFiles(dir) {
    return new Promise((resolve, reject) => {
      let files = this.fs.readdirSync(dir);
      let filesAvail = {};
      for (let j = 0; j < files.length; j++) {
        //filter migration files using regex.
        if (this.reFileName.test(files[ j ])) {
          filesAvail[ files[ j ].substr(0, 10) ] = files[ j ];
        }
      }
      this.filesAvail = filesAvail;
      resolve(filesAvail);
    });
  }

  difference(obj1, obj2) {
    for (let key in obj1) {
      if (obj1.hasOwnProperty(key)) {
        if (obj2[ key ] && obj2[ key ].length) {
          delete obj2[ key ];
        }
      }
    }
    return obj2;
  }

  getMigrationSet(direction, timestamp) {
    return new Promise((resolve, reject) => {
      let pending;
      if (direction == 'up') {
        pending = this.difference(this.filesRan, this.filesAvail);
        if(timestamp) {
          for (let key in pending) {
            if (pending[ timestamp ]) {
              if (pending.hasOwnProperty(key) && key > timestamp) {
                delete pending[ key ];
              }
            } else {
              if(this.filesRan[ timestamp ]){
                reject(`migration with timestamp ${timestamp} already ran`);
              }else {
                reject(`migration with timestamp ${timestamp} not found in pending migrations`);
              }
            }
          }
        }
      } else if (direction == 'down') {
        pending = this.filesRan;
        if(timestamp) {
          for (let key in pending) {
            if (pending[ timestamp ]) {
              if (pending.hasOwnProperty(key) && key < timestamp) {
                delete pending [ key ];
              }
            } else {
              if(this.filesAvail[ timestamp ]){
                reject(`migration with timestamp ${timestamp} not run yet`);
              }else {
                reject(`migration with timestamp ${timestamp} not found in pending rollbacks`);
              }
            }
          }
        }
      } else {
        reject('Migration direction must be specified');
      }
      resolve(pending || {});
    });
  }

}

module.exports = Common;
