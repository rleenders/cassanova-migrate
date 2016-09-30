'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const defaultTemplate = `'use strict';

const tools = require('itaas-nodejs-tools');
const uuid = require('uuid').v4;

let config = {};
let logger = tools.createLogger({logOutput: 'rotating-file', logDirectory: 'logs/migration'});
let serviceLocator = tools.createServiceLocator();
let context = tools.createCallContext(uuid(), config, logger, serviceLocator);

const migration = {
  up : function (db, handler) {
    let query = '-- first query';
    let params = [];

    tools.cassandra.cql.executeNonQuery(context, db, query, params)
      .then ((result)=>{
        
        let query = '-- second query';
        let params = [];

        return tools.cassandra.cql.executeNonQuery(context, db, query, params);
      })
      .then ((result)=>{
        handler(false, true);
      })
      .catch((err)=>{
        handler(err, false);
      });
  },
  down : function (db, handler) {
    let query = '-- first query';
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
`;

function create(name, directory, template) {
  return new Promise((resolve, reject) => {

    let regexName = /^[a-z0-9\_]*$/i;

    if (!regexName.test(name)) {
      return reject('Invalid title. Only alphanumeric and \'_\' title is accepted.');
    }

    if (!directory) {
      return reject('Missing directory.');
    }

    if (!template) {
      template = defaultTemplate;
    }

    let dateString = Math.floor(Date.now() / 1000) + '';
    let fileName = `${dateString}_${name}.js`;

    let filePath = path.join(
      process.cwd(),
      directory,
      fileName);

    let directoryPath = path.dirname(filePath);

    ensureDirectoryExists(directoryPath)
      .then((result) => {
        fs.writeFile(filePath, template, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(filePath);
        });
      });
  });
}

function ensureDirectoryExists(directoryPath) {
  return new Promise((resolve, reject) => {
    mkdirp(directoryPath, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

module.exports = create;
