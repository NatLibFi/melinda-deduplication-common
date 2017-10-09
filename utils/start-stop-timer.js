
const utils = require('./utils');

function createTimer(ONLINE, service, logger) {

  const onlineTimes = utils.parseTimeRanges(ONLINE);
  
  const initialAction = shouldBeRunningNow() ? 'Starting service' : 'Waiting before starting the service';
  logger.log('info', `Online times: ${ONLINE}. Current time: ${utils.getCurrentTime()}. ${initialAction}.`);

  let isRunning = false;
  function updateOnlineState() {
    const now = utils.parseTime(utils.getCurrentTime());
    if (shouldBeRunning(now)) {
      if (!isRunning) {

        logger.log('info', `It's ${utils.getCurrentTime()}. Starting the service.`);
        
        service.start().catch(error => {
          logger.log('error', error.message, error);
        });

        isRunning = true;
      }
    } else {
      if (isRunning) {
        
        logger.log('info', `It's ${utils.getCurrentTime()}. Stopping the service.`);
        
        service.stop().catch(error => { 
          logger.log('error', error.message, error);
        });
        isRunning = false;
      }
    }
  }

  function shouldBeRunningNow() {
    const now = utils.parseTime(utils.getCurrentTime());
    return shouldBeRunning(now);
  }
  function shouldBeRunning(now) {
    return onlineTimes.some(({from, to}) => from <= now && now <= to);
  }

  updateOnlineState();
  const onlinePoller = setInterval(updateOnlineState, 5000);
  
  return onlinePoller;
}

module.exports = createTimer;