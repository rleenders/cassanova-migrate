# Cassandra-migrate

Cassandra-migrate is a incremental migration tool for Cassandra.

## Features
- Uses the node cassandra-driver to run incremental migrations on Cassandra database.
- Uses Cassandra keyspace mentioned in commandline to keep track of ran migrations.
- Automatically builds and run UP or DOWN until any migration number.
- Creates a new incremental migration template by a single command.


## Installation

Install [node.js](http://nodejs.org/) and [cassandra](http://cassandra.apache.org/) and [cassandra-driver](https://www.npmjs.com/package/cassandra-driver). Then:

```
npm install git+https://github.com/UUX-Brasil/itaas-nodejs-tools.git#v1.0.0
```

## Overview

### Basic Usage

Add a file with the follow content to your app:
```
'use strict';

const exec = require('child_process').exec;
const getConfig = require('./my-config-file'); //CHANGE HERE

function execCallback(error, stdout, stderr) {
  // Log the output
  if (stdout) {
    console.log(stdout);
  }

  if (error) {
    // Log the err if it exists
    if (stderr) {
      console.log(stderr);
    }

    // Exit with the same error code from subprocess
    process.exit(error.code);
  }
  
  // It is OK
  process.exit(0);
}

function formatParams(paramaters){
  let params = '';

  // Ignore the first two parameters
  // First is node executable
  // Second is this file
  for (let i = 2; i < paramaters.length; i++){
    params += paramaters[i] + ' ';
  }

  params = params.trim();

  return params; 
}

function setEnvironmentVariables(config){
  process.env.DBHOST = config.MY_CASSANDRA_IP_LIST.join(','); // CHANGE HERE
  process.env.DBKEYSPACE = config.MY_KEY_SPACE; // CHANGE HERE
  process.env.DBUSER = config.MY_CASSANDRA_USER; // CHANGE HERE
  process.env.DBPASSWORD = config.MY_CASSANDRA_PASSWORD; // CHANGE HERE
}

// Set environment variables
let config = getConfig();
setEnvironmentVariables(config);

// Get Params
let params = formatParams(process.argv);

// Format command
let command = `migrate ${params}`;

// Exec
exec(command, execCallback);
```
Name it whatever you want, like `./app/migrate.js`, and add this to your `package.json` scripts:
```
node ./app/migrate.js
```

Creates a new migration with a timestamped migration number ( Used for tracking migrations ).

```
    migrate create <title>
```

Runs all migrations available in current directory.

```
    migrate up -k <keyspace>
```

Rolls back all migrations in the migrations table.

```
    migrate down -k <keyspace>
```


Goes back/forward to a particular migration automatically.

```
    migrate <up/down> -k <keyspace> -t <migration_timestamp>
```

Cassandra connection details can be specified in environmental variables
```
    DBHOST : sets hostname
    DBKEYSPACE : sets keyspace
    DBUSER : sets username
    DBPASSWORD : sets password;
```

More help.

```
    cassandra-migrate --help
```

## License

cassandra-migrate is distributed under the [MIT license](http://opensource.org/licenses/MIT).

## Contributions

Feel free to join in and support the project!

This repo was forked from: [rleenders/cassandra-migrate](https://github.com/rleenders/cassandra-migrate/issues)
