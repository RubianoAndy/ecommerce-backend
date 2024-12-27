'use strict';

const express = require('express');
const { Department } = require('../../models');

const logger = require('../config/logger');

const router = express.Router();

router.get('/departments/:countryId', async (request, response) => {
    const { countryId } = request.params;

    if (!countryId)
        return response.status(400).json({ message: 'No se ha proporcionado un país' });

    try {
        const departments = await Department.findAll({ 
            attributes: ['id', 'name'],
            where: { countryId } 
        });
        
        return response.status(200).json(departments);
    } catch (error) {
        logger.error(`Error al obtener los departamentos, provincias o estados: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al obtener los departamentos, provincias o estados',
            details: error.message,
        });
    }
});

module.exports = router;