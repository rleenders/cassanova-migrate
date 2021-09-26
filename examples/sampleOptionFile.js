var cassandra = require('cassandra-driver');
var fs = require('fs');

module.exports = {
  contactPoints: ['127.0.0.1'],
  keyspace: 'default',
  username: 'cassandra',
  password: 'cassandra',
  sslOptions:{
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    ca: [fs.readFileSync('ca.cer')]
  },
  protocolOptions:{
    port:'9042'
  },
  migrationsDir: './migrations',
}
