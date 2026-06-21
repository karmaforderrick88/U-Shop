import config from '../app/config.js';

class Logger {
  constructor() {
    this.enableDebugLogs = config.enableDebugLogs;
  }

  log(message, ...args) {
    if (this.enableDebugLogs) {
      console.log(message, ...args);
    }
  }

  warn(message, ...args) {
    console.warn(message, ...args);
  }

  error(message, ...args) {
    console.error(message, ...args);
  }

  info(message, ...args) {
    console.info(message, ...args);
  }

  debug(message, ...args) {
    if (this.enableDebugLogs) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}

export default new Logger(); 