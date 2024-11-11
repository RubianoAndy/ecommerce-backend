'use strict';

const express = require('express');
const winston = require('winston');
require('dotenv').config();
const { Sequelize } = require('sequelize');

const { User, Profile, Role } = require('../../models');

const authMiddleware = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/role-middleware');

const SUPERADMIN = 1;
const ADMIN = 2;

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

router.get('/users', authMiddleware, roleMiddleware([ SUPERADMIN, ADMIN ]), async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;

        const offset = (page - 1) * pageSize;

        const filters = request.query.filters ? JSON.parse(request.query.filters) : [];
        const filterConditions = {};

        filters.forEach(filter => {
            if (filter.field && filter.value !== undefined) {
                if (filter.field === 'name' || filter.field === 'email')
                    filterConditions[filter.field] = { [Sequelize.like]: `%${filter.value}%` };
                else
                    filterConditions[filter.field] = filter.value;  // Otros filtros directos (como roleId, activated)
            }
        });

        const users = await User.findAll({
            attributes: [
                'id',
                'email', // Si necesitas el email

                [Sequelize.col('Profile.name_1'), 'name_1'],
                [Sequelize.col('Profile.name_2'), 'name_2'],
                [Sequelize.col('Profile.lastname_1'), 'lastname_1'],
                [Sequelize.col('Profile.lastname_2'), 'lastname_2'],
                [Sequelize.col('Profile.dni'), 'dni'],
                [Sequelize.col('Profile.dniType'), 'dniType'],
                [Sequelize.col('Role.name'), 'role']
            ],
            where: filterConditions,
            limit: pageSize,
            offset: offset,
            include: [
                {
                    model: Profile,
                    required: false,    // Esto hace que sea un LEFT JOIN (opcional)
                    attributes: []      // No se duplican los atributos, solo se seleccionan arriba
                },
                {
                    model: Role,
                    required: false,    // Esto hace que sea un LEFT JOIN (opcional)
                    attributes: []      // No se duplican los atributos, solo se seleccionan arriba
                },
            ]
        });

        const totalUsers = await User.count({ where: filterConditions });

        const totalPages = Math.ceil(totalUsers / pageSize);

        return response.status(200).json({
            users: users,
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalUsers: totalUsers
        });
    } catch (error) {
        logger.error(`Error al obtener usuarios: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener usuarios', details: error.message });
    }
});

module.exports = router;