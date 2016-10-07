'use strict';


module.exports = {
  firstMigrationUp: 'CREATE TABLE table1 ( column1 TEXT, PRIMARY KEY (column1));',
  firstMigrationDown: 'DROP TABLE table1;',
  secondMigrationUp: 'CREATE TABLE table2 ( column1 TEXT, PRIMARY KEY (column1));',
  secondMigrationDown: 'DROP TABLE table2;',
  getMigrationWithFileName: 'select * from sys_cassandra_migrations where file_name=:fileName',
  dropKeySpace: 'DROP KEYSPACE IF EXISTS testing_cassandra_migrate;',
  createKeySpace: 'CREATE KEYSPACE testing_cassandra_migrate ' + 
    'WITH REPLICATION = { \'class\' : \'SimpleStrategy\', \'replication_factor\' : 1 };'
};
