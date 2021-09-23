class Helpers {

  static getDir(options) {
    const optionFile = options.parent.optionFile;
    let dir;
    if (optionFile) {
      dir = process.cwd() + require(`${process.cwd()}/${optionFile}`).migrationsDir;
    } else {
      dir = process.cwd();
    }
    return dir;
  }

}

module.exports = Helpers;