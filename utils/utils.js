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

function msToTime(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const totalMins = Math.floor(totalSeconds / 60);

  const hours = _.padStart(Math.floor(totalMins / 60), 2, '0');
  const mins = _.padStart(totalMins % 60, 2, '0');
  const secs = _.padStart(totalSeconds % 60, 2, '0');

  return `${hours}:${mins}:${secs}`;
}

function waitAndRetry(fn, onRetry, wait=3000) {
  let retryCount = 0;
  const retryFn = async function retry() {
    try {
      return await fn();
    } catch(error) {
      retryCount++;
      if (retryCount === 3) {
        throw error;
      } else {
        onRetry && onRetry(error);
        await new Promise(resolve => setTimeout(resolve, wait));
        return retryFn();
      }
    }
  };
  return retryFn();
}

// [A] -> Int -> [[A]]
function chunkWithWindow(list, windowSize) {
  const memory = [];
  return list.reduce((listOfLists, item) => {
    memory.push(item);
    if (memory.length == windowSize) {
      listOfLists.push(_.clone(memory));
      memory.shift();
    }
    
    return listOfLists;
  }, []);
}

function parseTime(time) {
  const [hour, minute] = time.split(':').map(numStr => parseInt(numStr));
  return hour * 60 + minute;
}

function getCurrentTime() {
  const time = new Date();
  return `${time.getHours()}:${time.getMinutes()}`;
}

function parseTimeRanges(timeRanges) {
  return timeRanges.split(',').map(rangeStr => {
    const [from, to] = rangeStr.trim().split('-');
    
    return { 
      from: parseTime(from),
      to: parseTime(to)
    };
  });
}

module.exports = {
  decorateConnectionWithDebug,
  readEnvironmentVariable,
  readArrayEnvironmentVariable,
  sequence,
  hrtimeToMs,
  waitAndRetry,
  chunkWithWindow,
  msToTime,
  parseTimeRanges,
  getCurrentTime,
  parseTime
};
