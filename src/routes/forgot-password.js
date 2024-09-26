'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const winston = require('winston');
require('dotenv').config();

const { User } = require('../../models');

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log' }),
    ]
});

const router = express.Router();

// The requests here

module.exports = router;