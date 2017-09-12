const winston = require('winston');
const moment = require('moment');

function createLogger() {
  return new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        timestamp: () => moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
      })
    ]
  });
}


const logger = createLogger();
logger.createLogger = createLogger;
module.exports = logger;
