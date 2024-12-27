const winston = require('winston');

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: 'error.log' })
    ]
});

module.exports = logger;