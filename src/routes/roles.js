'use strict';

const express = require('express');
const winston = require('winston');
require('dotenv').config();
const { Role } = require('../../models');

const authMiddleware = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/role-middleware');

const SUPER_ADMIN = Number(process.env.SUPER_ADMIN);
// const ADMIN = Number(process.env.ADMIN);

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

router.get('/all-roles', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    try {
        const roles = await Role.findAll({ attributes: ['id', 'name'] });       // Ignora los que tienen deleteAt diferente de null
        
        return response.status(200).json(roles);
    } catch (error) {
        logger.error(`Error al obtener los roles: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al obtener los roles',
            details: error.message,
        });
    }
});

module.exports = router;