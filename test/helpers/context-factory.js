'use strict';

const tools = require('itaas-nodejs-tools');
const uuid = require('uuid').v4;

let config = {};
let logger = tools.createLogger({logOutput: 'rotating-file', logDirectory: 'logs/test'});
let serviceLocator = tools.createServiceLocator();

module.exports = () => {
  return tools.createCallContext(uuid(), config, logger, serviceLocator);
};