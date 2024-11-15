'use strict';

const express = require('express');
const winston = require('winston');
require('dotenv').config();
const { Sequelize } = require('sequelize');

const { User, Profile, Role, UserActivation } = require('../../models');

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

router.get('/users', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;

        const offset = (page - 1) * pageSize;

        const filters = request.query.filters ? JSON.parse(request.query.filters) : [];
        const filterConditions = {};

        filters.forEach(filter => {
            if (filter.field && filter.value !== undefined) {
                if (filter.field === 'name' || filter.field === 'email')
                    filterConditions[filter.field] = { [Sequelize.Op.like]: `%${filter.value}%` };
                else
                    filterConditions[filter.field] = filter.value;  // Otros filtros directos (como roleId, activated)
            }
        });

        const users = await User.findAll({
            attributes: [
                'id',
                'email',
                'activated',
                'createdAt',

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
            ],
            order: [
                ['id', 'DESC']
            ]
        });

        const totalUsers = await User.count({ where: filterConditions });

        const totalPages = Math.ceil(totalUsers / pageSize);

        return response.status(200).json({
            users: users,
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalUsers: totalUsers,

            message: '¡Usuarios cargados exitosamente!'
        });
    } catch (error) {
        logger.error(`Error al obtener usuarios: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener usuarios', details: error.message });
    }
});

router.patch('/update-user-status', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const { userId, activated } = request.body;
    
    if (!userId || activated === undefined || activated === null)
        return response.status(400).json({ message: 'Todos los campos son obligatorios' });

    if (typeof activated !== 'boolean')
        return response.status(400).json({ message: 'El campo "activated" debe ser un valor booleano' });

    try {
        const user = await User.findOne({ where: { id: userId }});
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });

        await Promise.all([
            UserActivation.destroy({ where: { userId: userId } }),

            User.update(
                { activated: activated },
                { where : {id: userId} },
            )
        ]);
    
        return response.status(200).json({ message: 'Estado de usuario actualizado satisfactoriamente' });
    } catch (error) {
        logger.error(`Error al actualizar estado del usuario: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al actualizar estado del usuario',
            details: error.message,
        });
    }
});

module.exports = router;