'use strict';

/**
 * A method to create incremental new migrations
 * on create migration command.
 * e.g. cassandra-migration create
 * @param path
 */

class Create {

  constructor(fs, templateFile) {
    this.directory = 'migrations';
    this.fs = fs;
    this.dateString = Math.floor(Date.now() / 1000) + '';

    let template = `
'use strict';

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
        console.log(result);
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
        console.log(result);
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
    
    if (templateFile) {
      template = this.fs.readFileSync(templateFile);
    }
    this.template = template;
  }

  newMigration(title) {
    let reTitle = /^[a-z0-9\_]*$/i;
    if (!reTitle.test(title)) {
      console.log("Invalid title. Only alphanumeric and '_' title is accepted.");
      process.exit(1);
    }

    let fileName = `${this.dateString}_${title}.js`;
    this.fs.writeFileSync(`${process.cwd()}/${directory}/${fileName}`, this.template);
    console.log(`Created a new migration file with name ${fileName}`);
  }
}

module.exports = Create;
