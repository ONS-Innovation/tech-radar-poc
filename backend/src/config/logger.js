const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create the winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Always log to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add CloudWatch transport if AWS credentials are available
if (process.env.AWS_REGION) {
  logger.add(new WinstonCloudWatch({
    logGroupName: process.env.CLOUDWATCH_GROUP_NAME || '/tech-radar/backend',
    logStreamName: `${process.env.NODE_ENV || 'development'}-${new Date().toISOString().split('T')[0]}`,
    awsRegion: process.env.AWS_REGION,
    messageFormatter: ({ level, message, ...meta }) => {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
      });
    }
  }));
}

// Export helper functions for different log levels
module.exports = {
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  // Raw logger instance if needed
  logger
}; 