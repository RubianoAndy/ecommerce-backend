'use strict';

const express = require('express');
const validator = require('validator');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');
require('dotenv').config();

const logger = require('../config/logger');
const limiter = require('../config/limiter');

const { User, Profile, Correspondence, Role, UserActivation, Country, Department } = require('../../models');

const authMiddleware = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/role-middleware');

const SUPER_ADMIN = Number(process.env.SUPER_ADMIN);
// const ADMIN = Number(process.env.ADMIN);

const router = express.Router();

router.get('/users', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
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
        let profileConditions = {};

        filters.forEach(filter => {
            if (filter.field && filter.value !== undefined) {
                if (filter.field === 'name') {
                    const searchTerm = filter.value.toLowerCase().trim();
                    
                    if (searchTerm.length > 0) {
                        profileConditions = {
                            [Sequelize.Op.or]: [
                                {name_1: { [Sequelize.Op.iLike]: `%${searchTerm}%` }},
                                {name_2: { [Sequelize.Op.iLike]: `%${searchTerm}%` }},
                                {lastname_1: { [Sequelize.Op.iLike]: `%${searchTerm}%` }},
                                {lastname_2: { [Sequelize.Op.iLike]: `%${searchTerm}%` }}
                            ]
                        };
                    }
                } else if (filter.field == 'email')
                    filterConditions.email = { [Sequelize.Op.iLike]: `%${filter.value}%` };
                else if (filter.field === 'dni') {
                    if (filter.value === null)
                        profileConditions.dni = null;
                    else
                        profileConditions.dni = { [Sequelize.Op.like]: `%${filter.value}%` };
                } else
                    filterConditions[filter.field] = filter.value;  // Filtros exactos en users, como role y activated
            }
        });

        const query = {
            attributes: [
                'id',
                'email',
                'activated',
                'createdAt',

                [Sequelize.col('Role.name'), 'role']
            ],
            where: filterConditions,
            limit: pageSize,
            offset: offset,
            include: [
                {
                    model: Profile,
                    required: true,     // true para hacer un INNER JOIN
                    where: profileConditions,
                    attributes: [
                        'name_1', 'name_2', 'lastname_1', 'lastname_2', 'dni', 'dniType'
                    ],
                    include: [
                        {
                            model: Correspondence,
                            require: true,
                            // where: correspondenceConditions,
                            attributes: [
                                'countryId', 'departmentId', 'city'
                            ],
                            include: [
                                {
                                    model: Country,
                                    require: false,
                                    attributes: [
                                        'name'
                                    ]
                                },
                                {
                                    model: Department,
                                    require: false,
                                    attributes: [
                                        'name'
                                    ]
                                }
                            ],
                        }
                    ],
                },
                {
                    model: Role,
                    required: false,     // false para hacer un LEFT JOIN
                    attributes: []
                }
            ],
            order: [
                ['id', 'DESC']
            ]
        };

        const users = await User.findAll(query);

        const totalUsers = await User.count({
            where: filterConditions,
            include: [
                {
                    model: Profile,
                    required: true, // true para hacer un INNER JOIN
                    where: profileConditions
                }
            ]
        });

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

router.post('/user', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const { name_1, name_2, lastname_1, lastname_2, dniType, dni, prefix, mobile, email, password, roleId } = request.body;
    if (!name_1 || !lastname_1 || !dniType || !dni || !prefix || !mobile || !email || !password || !roleId)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    if (!validator.isEmail(email))
        return response.status(400).json({ message: 'El formato del correo electrónico no es válido' });

    try {
        const user = await User.findOne({ where: { email } });
        if (user)
            return response.status(400).json({ message: 'El usuario ya existe' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            roleId,
            activated: true,
        });

        await Profile.create({
            name_1,
            name_2,
            lastname_1,
            lastname_2,
            dniType,
            dni,
            prefix,
            mobile,
            userId: newUser.id
        });

        return response.status(201).json({ message: 'Usuario creado satisfactoriamente' });
    } catch (error) {
        logger.error(`Error al crear el usuario: ${error.message}`);
        return response.status(500).json({
            message: 'Error al crear el usuario',
            details: error.message,
        });
    }
});

router.get('/user/:userId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const userId = Number(request.params.userId);
    if (isNaN(userId) || userId <= 0)
        return response.status(400).json({ message: 'ID de usuario inválido' });
    
    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        // if (!user.activated)
        //     return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        const result = {
            id: profile.id,
            name_1: profile.name_1,
            name_2: profile.name_2,
            lastname_1: profile.lastname_1,
            lastname_2: profile.lastname_2,
            dniType: profile.dniType,
            dni: profile.dni,
            prefix: profile.prefix,
            mobile: profile.mobile,
            email: user.email,
            roleId: user.roleId,

            message: 'Usuario cargado exitosamente',
        };
        
        return response.status(200).json(result);
    } catch (error) {
        logger.error(`Error al obtener el usuario: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener el usuario', details: error.message });
    }
});

router.patch('/user-status', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), limiter(10, 20), async (request, response) => {
    const { userId, activated } = request.body;
    
    if (!userId || activated === undefined || activated === null)
        return response.status(400).json({ message: 'Todos los campos son obligatorios' });

    if (typeof activated !== 'boolean')
        return response.status(400).json({ message: 'El campo "activated" debe ser un valor booleano' });

    try {
        const user = await User.findOne({ where: { id: userId }});
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });

        await UserActivation.destroy({ where: { userId: userId } }),

        user.activated = activated;
        await user.save();
    
        return response.status(200).json({ message: 'Estado de usuario actualizado satisfactoriamente' });
    } catch (error) {
        logger.error(`Error al actualizar estado del usuario: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al actualizar estado del usuario',
            details: error.message,
        });
    }
});

router.put('/user/:userId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    const userId = request.params.userId;
    if (isNaN(userId) || userId <= 0)
        return response.status(400).json({ message: 'ID de usuario inválido' });

    const { name_1, name_2, lastname_1, lastname_2, dniType, dni, prefix, mobile, email, password, roleId } = request.body;
    if (!name_1 || !lastname_1 || !dniType || !dni || !prefix || !mobile || !email || !roleId)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    if (!validator.isEmail(email))
        return response.status(400).json({ message: 'El formato del correo electrónico no es válido' });

    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        // if (!user.activated)
        //     return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        if (password) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch)
                return response.status(400).json({ message: 'La contraseña es igual a la anterior' });

            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        profile.name_1 = name_1;
        profile.lastname_1 = lastname_1;
        profile.dniType = dniType;
        profile.dni = dni;
        profile.prefix = prefix;
        profile.mobile = mobile;

        user.email = email;

        if (name_2)
            profile.name_2 = name_2;
        else
            profile.name_2 = null;
        
        if (lastname_2)
            profile.lastname_2 = lastname_2;
        else
            profile.lastname_2 = null;

        await Promise.all([
            profile.save(),
            user.save(),

        ]);

        const result = {
            id: profile.id,
            name_1: profile.name_1,
            name_2: profile.name_2,
            lastname_1: profile.lastname_1,
            lastname_2: profile.lastname_2,
            dniType: profile.dniType,
            dni: profile.dni,
            prefix: profile.prefix,
            mobile: profile.mobile,
            email: user.email,
            roleId: user.roleId,

            message: 'Usuario actualizado exitosamente',
        };
        
        return response.status(200).json(result);

    } catch (error) {
        logger.error(`Error al actualizar la información del usuario: ${error.message}`);
        return response.status(500).json({ message: 'Error al actualizar la información del usuario', details: error.message });
    }
});

router.get('/users/excel', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), limiter(10, 20), async (request, response) => {
    try {
        const users = await User.findAll({
            include: [
                {
                    model: Profile,
                    required: true, // INNER JOIN
                    attributes: [
                        'id',
                        'name_1',
                        'name_2',
                        'lastname_1',
                        'lastname_2',
                        'dni',
                        'dniType',
                        'prefix',
                        'mobile'
                    ],
                },
                {
                    model: Role,
                    required: false, // LEFT JOIN
                    attributes: ['name']
                }
            ],
            order: [['id', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Usuarios');

        worksheet.columns = [
            { header: 'Usuario ID', key: 'userId', width: 15 },
            { header: 'Perfil ID', key: 'profileId', width: 15 },
            { header: 'Rol', key: 'role', width: 20 },
            { header: 'Estado', key: 'activated', width: 10 },
            { header: 'Fecha de creación', key: 'createdAt', width: 20 },
            { header: 'Apellido 1', key: 'lastname_1', width: 20 },
            { header: 'Apellido 2', key: 'lastname_2', width: 20 },
            { header: 'Nombre 1', key: 'name_1', width: 20 },
            { header: 'Nombre 2', key: 'name_2', width: 20 },
            { header: 'Tipo DNI', key: 'dniType', width: 30 },
            { header: 'DNI', key: 'dni', width: 15 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Prefijo', key: 'prefix', width: 10 },
            { header: 'Celular', key: 'mobile', width: 15 },
        ];

        users.forEach(user => {
            const profile = user.Profile;

            worksheet.addRow({
                userId: user.id,
                profileId: profile.id,
                role: user.Role ? user.Role.name : '',
                activated: user.activated ? 'Activo' : 'Inactivo',
                createdAt: user.createdAt,
                lastname_1: profile.lastname_1,
                lastname_2: profile.lastname_2,
                name_1: profile.name_1,
                name_2: profile.name_2,
                dniType: profile.dniType,
                dni: profile.dni,
                email: user.email,
                prefix: profile.prefix,
                mobile: profile.mobile,
            });
        });

        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader('Content-Disposition', `attachment; filename=Usuarios.xlsx`);

        await workbook.xlsx.write(response);
    } catch (error) {
        logger.error(`Error al generar el archivo Excel de usuarios: ${error.message}`);
        return response.status(500).json({ message: 'Error al generar el archivo Excel de usuarios', details: error.message });
    }
});

module.exports = router;