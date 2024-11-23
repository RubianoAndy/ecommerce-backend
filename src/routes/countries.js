'use strict';

const express = require('express');
const winston = require('winston');
require('dotenv').config();
const { Country } = require('../../models');


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

router.get('/countries', async (request, response) => {
    try {
        const countries = await Country.findAll({ attributes: ['id', 'name', 'prefix'] });
        
        return response.status(200).json(countries);
    } catch (error) {
        logger.error(`Error al obtener los países: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al obtener los países',
            details: error.message,
        });
    }
});

module.exports = router;