'use strict';
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const directory = './test/data';
const targetDirectory = './migrations';

function move(){
  clearTargetDirectory();

  let files = getFilesName();
  
  for (let fileName of files) {
    let filePath = path.join(directory, fileName);
    let targetFilePath = path.join(targetDirectory, fileName);

    let fileContent = fs.readFileSync(filePath);
    
    fs.writeFileSync(targetFilePath, fileContent);
  }
}

function getFilesName(){
  let files = fs.readdirSync(directory);
  return files;
}

function clearTargetDirectory(){
  rimraf.sync(targetDirectory);
  fs.mkdirSync(targetDirectory);
}

module.exports = {
  move: move,
  getFilesName: getFilesName
};
