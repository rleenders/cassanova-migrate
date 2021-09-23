var cassandra = require('cassandra-driver');
var fs = require('fs');
module.exports = {
  contactPoints: ['127.0.0.1'],
  keyspace: 'default',
  authProvider: new cassandra.auth.PlainTextAuthProvider('cassandra', 'cassandra'),
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
