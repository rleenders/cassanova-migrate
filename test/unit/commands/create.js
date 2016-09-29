'use strict';
/* global describe,it */
const create = require('../../../commands/create');
const fs = require('fs');
const should = require('should'); // eslint-disable-line no-unused-vars
const path = require('path');
const rimraf = require('rimraf');


describe('Create', function () {
  it('Should create a file with requested name', function (done) {
    let directoryPath = path.join(
      process.cwd(),
      'test-data');

    try {
      rimraf.sync(directoryPath);
    } catch (error) {
      console.log(error);
    }

    create('my_awesome_name', 'test-data')
      .then((result) => {
        fs.readdirSync(directoryPath).should.have.length(1);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});


