'use strict';

const express = require('express');
const winston = require('winston');
const { Sequelize } = require('sequelize');
const ExcelJS = require('exceljs');
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

        let filters = {};

        try {
            filters = request.query.filters ? JSON.parse(request.query.filters) : [];
        } catch (error) {
            logger.error(`Error en el formato de los filtros: ${error.message}`);
            return response.status(400).json({ message: 'Error en el formato de los filtros' });
        }

        let filterConditions = {};

        filters.forEach(filter => {
            if (filter.field && filter.value !== undefined) {
                if (filter.field === 'id') {
                    const id = parseInt(filter.value, 10);
                    if (!isNaN(id))
                        filterConditions.id = { [Sequelize.Op.eq]: id };
                    else {
                        logger.error(`Valor no válido para id: ${filter.value}`);
                        return response.status(400).json({ message: 'El valor del ID debe ser un número' });
                    }
                } else if (filter.field === 'name') {
                    const searchTerm = filter.value.toLowerCase().trim();
                    filterConditions.name = { [Sequelize.Op.iLike]: `%${searchTerm}%` };
                }
            }
        });

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

router.get('/role/:roleId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const roleId = request.params.roleId;

    if (isNaN(roleId) || roleId <= 0)
        return response.status(400).json({ message: 'ID de rol inválido' });

    try {
        const role = await Role.findOne({ 
            where: { id: roleId }, 
            attributes: ['id', 'name'] 
        });

        const result = {
            // id: role.id,
            name: role.name,
            message: 'Rol cargado exitosamente',
        };
        return response.status(200).json(result);
    } catch (error) {
        logger.error(`Error al obtener el rol: ${error.message}`);
        return response.status(500).json({
            message: 'Error al obtener el rol',
            details: error.message,
        });
    }
});

router.post('/role', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const { name } = request.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    try {
        await Role.create({ name });

        return response.status(201).json({ message: 'Rol creado satisfactoriamente' });
    } catch (error) {
        logger.error(`Error al crear el rol: ${error.message}`);
        return response.status(500).json({
            message: 'Error al crear el rol',
            details: error.message,
        });
    }
});

router.put('/role/:roleId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const roleId = request.params.roleId;
    if (isNaN(roleId) || roleId <= 0)
        return response.status(400).json({ message: 'ID de rol inválido' });

    const { name } = request.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    try {
        const role = await Role.findOne({ where: { id: roleId }});
        if (!role)
            return response.status(404).json({ message: 'No existe rol asociado' });

        role.name = name;
        await role.save();

        return response.status(200).json({ message: 'Rol actualizado satisfactoriamente' });
    } catch (error) {
        logger.error(`Error al crear el rol: ${error.message}`);
        return response.status(500).json({
            message: 'Error al crear el rol',
            details: error.message,
        });
    }
});

router.delete('/role/:roleId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const { roleId } = request.params;
    if (isNaN(roleId) || roleId <= 0)
        return response.status(400).json({ message: 'ID de rol inválido' });

    if (!roleId)
        return response.status(400).json({ message: 'No se ha proporcionado un rol' });

    try {
        const role = await Role.findOne( { where : { id: roleId }});

        if (!role)
            return response.status(404).json({ message: 'Rol no encontrado' });

        if (role.deletedAt)
            return response.status(403).json({ message: 'El rol ya había sido eliminado' });
        
        // role.deletedAt = new Date();
        // await role.save();

        await role.destroy();       // No destruye el registro si el modelo tiene paranoid en true (soft delete)

        return response.status(200).json({ message: 'Rol eliminado satisfactoriamente' });

    } catch (error) {
        logger.error(`Error al eliminar el rol: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al eliminar el rol',
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

router.get('/roles/excel', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    try {
        const roles = await Role.findAll({
            order: [['id', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Roles');

        worksheet.columns = [
            { header: 'Rol ID', key: 'roleId', width: 15 },
            { header: 'Fecha de creación', key: 'createdAt', width: 20 },
            { header: 'Fecha de actualización', key: 'updatedAt', width: 20 },
            { header: 'Nombre', key: 'name', width: 20 },
        ];

        roles.forEach(role => {

            worksheet.addRow({
                roleId: role.id,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
                name: role.name,
            });
        });

        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader('Content-Disposition', `attachment; filename=Roles.xlsx`);

        await workbook.xlsx.write(response);
    } catch (error) {
        logger.error(`Error al generar el archivo Excel de roles: ${error.message}`);
        return response.status(500).json({ message: 'Error al generar el archivo Excel de roles', details: error.message });
    }
});

module.exports = router;