'use strict';

const express = require('express');
const { Country } = require('../../models');

const logger = require('../config/logger');

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