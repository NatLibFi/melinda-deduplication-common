/* eslint-disable no-console */
const _ = require('lodash');

function decorateConnectionWithDebug(connection) {

  const actualExecute = connection.execute;
  connection.execute = function() {
    console.log('DEBUG-SQL', `'${arguments[0]}'`, arguments[1]); //eslint-disable-line no-console
    return actualExecute.apply(this, arguments);
  };
}

function readEnvironmentVariable(name, defaultValue, opts) {

  if (process.env[name] === undefined) {
    if (defaultValue === undefined) {
      const message = `Mandatory environment variable missing: ${name}`;
      console.error(message);
      throw new Error(message);
    }
    const loggedDefaultValue = _.get(opts, 'hideDefaultValue') ? '[hidden]' : defaultValue;
    console.log(`No environment variable set for ${name}, using default value: ${loggedDefaultValue}`);
  }

  return _.get(process.env, name, defaultValue);
}
function readArrayEnvironmentVariable(name, defaultValue, opts) {
  const value = readEnvironmentVariable(name, defaultValue, opts);
  return value === defaultValue ? value : value.split('|');
}

function sequence(funcs) {
  return funcs.reduce((promise, func) => {
    return promise.then((all) => func().then(result => _.concat(all, result)));
  }, Promise.resolve([]));
}

function hrtimeToMs(hrtime) {
  const NS_PER_SEC = 1e9;
  const ns = hrtime[0] * NS_PER_SEC + hrtime[1];

  return Math.round(ns/1000000);
}

module.exports = {
  decorateConnectionWithDebug,
  readEnvironmentVariable,
  readArrayEnvironmentVariable,
  sequence,
  hrtimeToMs
};
