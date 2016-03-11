#!/usr/bin/env node
/*jslint node: true */
"use strict";

var program = require("commander"),
  fs = require('fs'),
  exists = fs.existsSync || path.existsSync,
  Database = require('../config/database'),
  db,
  async = require("async"),
  cwd,
  migFilesAvail = [],
  migration_settings = require("../scripts/migrationSettings.json"),
  batchQueries = [],
  upQueries = [],
  downQueries = [],
  reFileName = /^[0-9]{10}_[a-z0-9]*.js$/i, // regex to find migration files.,
  filesRan = [],
  path = require('path');

/**
 * Usage information.
 */

var usage = [
  '',
  '  example : ',
  '',
  '  cassanova-migrate [options] [command]',
  '',
  '  cassanova-migrate -k <keyspace> -c <cql_command>. (Runs a CQL command)',
  '',
  '  cassanova-migrate -k <keyspace>. (Runs pending cassandra migrations)',
  '',
  '  cassanova-migrate -k <keyspace> -n <migration_number>. (Runs cassandra migrations UP or DOWN. Decides automatically).',
  '',
  '  cassanova-migrate <create>. (Creates a new cassandra migration)',
  '',
  '  cassanova-migrate -k <keyspace> -s',
  '',
  '  cassanova-migrate <create> -t <template> (Creates a new cassandra migrate but uses a specified template instead of default).',
  '',

].join('\n');

program.on('--help', function () {
  console.log(usage);
});

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version)
  .option('-k, --keyspace "<keyspace>"', "The name of the keyspace to use.")
  .option('-c, --cql "<cqlStatement>"', "Run a single cql statement.")
  .option('-n, --num "<migrationNumber>"', "Run migrations until migration Number.")
  .option('-h, --hosts "<host,host>"', "Comma seperated host addresses. Default is [\"localhost\"].")
  //.option('-p, --port "<port>"', "Defaults to cassandra default 9042.")
  .option('-s, --silent', "Hide output while executing.", false)
  .option('-u, --username "<username>"', "database username")
  .option('-p, --password "<password>"', "database password")
  .option('-t, --template "<template>"', "sets the template for create");

program.name = 'cassanova-migrate';

// init command

/**
 * A method to create incremental new migrations
 * on create migration command.
 * e.g. cassanova-migration create
 * @param path
 */

var createMigration = function (title) {

  var files = fs.readdirSync(process.cwd()),
    migFiles = [],
    count,
    reTitle = /^[a-z0-9]*$/i;

  if (!reTitle.test(title)) {
    console.log('Invalid title. Only alphanumeric title is accepted.');
    process.exit(1);
  }

  var dateString = Math.floor(Date.now() / 1000) + '';

  var fileName = dateString + '_' + title + '.js';

  var template = `
    var migration${dateString} = {
      up : function (db, handler) {
          var query = '';
          var params = [];
          db.execute(query, params, { prsepare: true }, function (err) {
              if (err) {
                  handler(err, false);
              } else {
                  handler(false, true);
              }
          });
      },
      down : function (db, handler) {
          var query = '';
          var params = [];
          db.execute(query, params, { prepare: true }, function (err) {
              if (err) {
                  handler(err, false);
              } else {
                  handler(false, true);
              }
          });
      }
    };
    module.exports = migration${dateString};`;

  if (program.template) {
    template = fs.readFileSync(program.template);
  }

  fs.writeFileSync(`${process.cwd()}/${fileName}`, template);
  console.log("Created a new migration file with name " + fileName);
  process.exit(0);

};

program
  .command('create <title>')
  .description('initialize a new migration file with title.')
  .action(createMigration);

program.parse(process.argv);

/**
 * A method to check if sys_migration table is created,
 * if created what all scripts have already run.
 * @param callback
 */

var prepareMigrations = function (callback) {

  output("Validating Migration.");

  // If cql is passed just run the cql. Don't run migrations.
  if (program.cql) {
    batchQueries.push(program.cql.toString().trim());
    return callback(null, true);
  }

  async.waterfall(
    [
      function (callback) {
        // Create migration table if doesn't exist
        var query;
        db.execute(migration_settings.createMigrationTable, null, {prepare: true}, function(err, response) {
          if (err) {
            return callback(err);
          }
          callback(null);
        });
      },
      function (callback) {
        db.execute(migration_settings.getMigration, null, { prepare: true }, function (err, alreadyRanFiles) {
          if (err) {
            return callback(err);
          }
          callback(null, alreadyRanFiles.rows);
        });
      },
      /**
       * This method takes alreadyRan files compares with available migrations on disk.
       * If a particular migration is already run, it ignores them otherwise
       * loads queries in batch queries.
       *
       * @param alreadyRan files
       * @param callback
       * @returns {*}
       */
        function (alreadyRan, callback) {

        // Populating already run files.
        for (var i = 0; i < alreadyRan.length; i++) {
          filesRan.push(alreadyRan[ i ].file_name);
        }
        var files = fs.readdirSync(cwd),
          migAvail = [],
          migApplied = [],
          desiredMigration = program.num ? program.num : null;
        //loop through all available files in current working directory.
        for (var j = 0; j < files.length; j++) {
          //filter migration files using regex.
          if (reFileName.test(files[ j ])) {
            migAvail.push(files[ j ].substr(0, 10));
            // Keeping list of only migration files for future reference.
            migFilesAvail.push(files[ j ]);
            //if migration file already ran push to migApplied.
            if (filesRan.indexOf(files[ j ]) !== -1) {
              //needToRun.push(files[j]);
              migApplied.push(files[ j ].substr(0, 10));
            }
          }
        }
        if (desiredMigration && migAvail.indexOf(desiredMigration) === -1) {
          return callback('Migration number ' + program.num + ' doesn\'t exist on disk');
        }

        if (desiredMigration && migApplied.indexOf(desiredMigration) !== -1 && (migApplied.indexOf(desiredMigration) + 1) <= migApplied.length) {
          // If user wants to go to an old migration in db. Migration mentioned has to be in migApplied
          (function revertMigration() {
            // Work backwards, down migrate until them desiredMigration.down is applied
            var lastIndex = migApplied.length - 1;
            for (var i = lastIndex; i >= migApplied.indexOf(desiredMigration) && i >= 0; i--) {
              var fileName = migFilesAvail[ migAvail.indexOf(migApplied[i]) ];
              var attributes = fileName.split(/\_/);
              var query = {
                'file': fileName, 'num': attributes[ 0 ], 'name': fileName.replace(".js", ""),
                run: require(path.resolve(cwd + "/" + fileName))
              };

              downQueries.push(query);
            }
          })();
        } else {

          (function getUpQueriesUntilMigration() {
            var migrationFrom = migApplied.length,
              migrationTo;

            //If desired todo
            if (desiredMigration && (migAvail.indexOf(desiredMigration) + 1) < migAvail.length) {
              migrationTo = migAvail.indexOf(desiredMigration) + 1;
            } else {
              migrationTo = migAvail.length;
            }

            for (var k = migrationFrom; k < migrationTo; k++) {
              var fileName = migFilesAvail[ migAvail.indexOf(migAvail[ k ]) ],
                attributes = fileName.split("_"),
                query = {
                  'file': fileName, 'num': attributes[ 0 ], 'name': attributes[ 1 ].replace(".js", ""),
                  'run': require(path.resolve(cwd + "/" + fileName))
                };
              upQueries.push(query);

            }
          })();
        }

        // Return if there are no migration to run.
        if (!upQueries.length && !downQueries.length) {
          return callback('No incremental upgrades to run at this time.');
        }
        //console.log('batchQueries : \n' + JSON.stringify(batchQueries, null, 2));
        //console.log('migrationInsertQueries :\n' + JSON.stringify(migrationInsertQueries, null, 2));
        //batchQueries.splice.apply(batchQueries, [batchQueries.length, 0].concat(migrationInsertQueries));
        //console.log('batchQueries : \n' + JSON.stringify(batchQueries, null, 2));
        callback(null, false);
      }
    ],
    function (err, res) {
      if (err) {
        if (err) {
          callback(err);
        }
      }

      callback(null, true);
    }
  );
};

/**
 * Initializes the query batch to execute.
 * @param  {Function} callback Callback to async with error or success
 */
var runQueries = function (callback) {

  output("Initializing queries...");


  if (!program.cql) {
    console.log("Applying incremental upgrades.");
  }

  if (batchQueries && batchQueries.length > 0) {
    // setting up Keyspace for cql and files.
    batchQueries.unshift("USE " + program.keyspace + ";");
    output("Running queries...");
    executeQuery(batchQueries.shift(), callback);
  } else if (upQueries && upQueries.length > 0) {
    up(upQueries.shift(), callback);
  } else if (downQueries && downQueries.length > 0) {
    down(downQueries.shift(), callback);
  } else {
    console.log("No migrations to run")
  }
};

var up = function (query, callback) {
  output(`Migrating changes: ${query.name}`);
  query.run.up(db, function (err) {
    if (err) {
      return callback(err, null);
    } else {
      db.execute(migration_settings.insertMigration, [ query.file, Date.now(), query.num, query.name ],
        { prepare: true }, function (err) {
          if (err) {
            return callback(err, null);
          } else {
            if (upQueries.length > 0) {
              up(upQueries.shift(), callback);
            } else {
              callback(null, true);
              process.nextTick(function () {
                process.exit(1);
              });
            }
          }
        });
    }
  });
};

var down = function (query, callback) {
  query.run.down(db, function (err) {
    output(`Rolling back changes: ${query.name}`);
    if (err) {
      return callback(err, null);
    } else {
      db.execute(migration_settings.deleteMigration, [ query.file ], { prepare: true }, function (err) {
        if (err) {
          return callback(err, null);
        } else {
          if (downQueries.length > 0) {
            down(downQueries.shift(), callback);
          } else {
            callback(null, true);
            process.nextTick(function () {
              process.exit(1);
            });
          }
        }
      });
    }
  });
};


/**
 * A recursive method, that executes each query.
 * @param  {String} eQuery The cql string to be executed.
 * @param  {Function} callback Callback to async with error or success
 */
var executeQuery = function (eQuery, callback) {

  output("Executing:\t\t" + eQuery);

  db.execute(eQuery, function (err) {
    if (err) {
      return callback(err, null);
    } else {
      if (batchQueries.length > 0) {
        executeQuery(batchQueries.shift(), callback);
      } else {
        callback(null, true);

        process.nextTick(function () {
          process.exit(1);
        });
      }
    }
  });
};

/**
 * Starts db.
 * @param  {Function} callback Callback to async with error or success
 */
var dbConnect = function (callback) {
  var settings = {};

  output("Connecting to database...");
  //We need to be able to do anything with any keyspace. We just need a db connection. Just send
  //in the hosts, username and password, stripping the keyspace.
  //opts.username = process.env.CASS_USER || config.db.username;
  //opts.password = process.env.CASS_PASS || config.db.password;
  if (program.username) {
    settings.username = program.username;
  }
  if (program.password) {
    settings.password = program.password;
  }
  settings.hosts = program.hosts ? program.hosts : [ "localhost" ];
  settings.keyspace = program.keyspace ? program.keyspace : process.env.DBKEYSPACE;
  db = new Database(settings);
  callback(null, true);
};

/**
 * Output messages to console if not running silent.
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
var output = function (msg) {
  if (!program.silent) {
    console.log(msg);
  }
};

output("Initializing Migration...");

/**
 * Verifies the arguments are valid and have required arguments.
 * @param  {Function} callback Callback to async with error or success.
 */
var processArguments = function (callback) {
  output("Processing arguments...");

  if ((!program.keyspace || program.keyspace.length === 0)) {
    return callback("A keyspace has not been defined. Use -k option to define keyspace (check --help for more details).");
  }
  program.hosts = !program.hosts ? program.hosts : program.hosts.split(",");
  if ((program.hosts && program.hosts.length === 0) || (program.hosts && !(program.hosts instanceof Array))) {
    return callback("An invalid host is defined. Use --help to check proper usage.");
  }

  cwd = program.args[ 0 ] ? program.args[ 0 ] : process.cwd();

  if (!exists(cwd)) {
    return callback("The path " + cwd + " can't be resolved");
  }

  // loading cql scripts

  callback(null, true);
};

async.series(
  [
    function (callback) {
      processArguments(callback);
    },
    function (callback) {
      dbConnect(callback);
    },
    function (callback) {
      prepareMigrations(callback);
    },
    function (callback) {
      runQueries(callback);
    }
  ],
  function (err, callback) {
    if (err) {
      console.log(err);
      process.exit(1);
    } else {
      output("Migration Complete!");
      process.exit(0);
    }
  }
);
