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

router.get('/roles', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;

        const offset = (page - 1) * pageSize;

        let filters = [];

        try {
            filters = request.query.filters ? JSON.parse(request.query.filters) : [];
        } catch (error) {
            logger.error(`Error en el formato de los filtros: ${error.message}`);
            return response.status(400).json({ message: 'Error en el formato de los filtros' });
        }

        let filterConditions = {};

        const query = {
            attributes: [
                'id',
                'name',
                'createdAt',
                'updatedAt',
            ],
            where: filterConditions,
            limit: pageSize,
            offset: offset,
            include: [],
            order: [
                ['id', 'ASC']
            ]
        }

        const roles = await Role.findAll(query);       // Ignora los que tienen deleteAt diferente de null

        const totalRoles = await Role.count({
            where: filterConditions,
            include: []
        });

        const totalPages = Math.ceil(totalRoles / pageSize);
        
        return response.status(200).json({
            roles: roles,
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalRoles: totalRoles,
            message: '¡Roles cargados exitosamente!'
        });
    } catch (error) {
        logger.error(`Error al obtener los roles: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al obtener los roles',
            details: error.message,
        });
    }
});

router.get('/roles-small', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
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