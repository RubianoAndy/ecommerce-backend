'use strict';

const express = require('express');
const winston = require('winston');
const validator = require('validator');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { User, Profile } = require('../../models');
const authMiddleware = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/role-middleware');

const SUPER_ADMIN = Number(process.env.SUPER_ADMIN);

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

router.get('/profile', authMiddleware, async (request, response) => {
    const userId = request.accessTokenDecoded.id;       // Se decodifica en el authMiddleware
    
    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

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

            message: 'Perfil cargado exitosamente',
        };
        
        return response.status(200).json(result);
    } catch (error) {
        logger.error(`Error al obtener el perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener el perfil', details: error.message });
    }
});

router.put('/update-profile', authMiddleware, async (request, response) => {
    const userId = request.accessTokenDecoded.id;

    const { name_2, lastname_2, dniType, dni, prefix, mobile } = request.body;

    if (!prefix || !mobile)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        profile.prefix = prefix;
        profile.mobile = mobile;

        // Son obligatorios pero con disable en el formulario
        if(dniType)
            profile.dniType = dniType;
        
        if (dni)
            profile.dni = dni;

        // Estos son campos opcionales, por eso se coloca el else
        if (name_2)
            profile.name_2 = name_2;
        else
            profile.name_2 = null;
        
        if (lastname_2)
            profile.lastname_2 = lastname_2;
        else
            profile.lastname_2 = null;

        await profile.save();

        return response.status(200).json({ message: 'Perfil actualizado correctamente' });

    } catch (error) {
        logger.error(`Error al actualizar la información del perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al actualizar la información del perfil', details: error.message });
    }
});

router.get('/profile/:userId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
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

            message: 'Perfil cargado exitosamente',
        };
        
        return response.status(200).json(result);
    } catch (error) {
        logger.error(`Error al obtener el perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener el perfil', details: error.message });
    }
});

router.put('/update-profile/:userId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
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

        return response.status(200).json({ message: 'Perfil actualizado correctamente' });

    } catch (error) {
        logger.error(`Error al actualizar la información del perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al actualizar la información del perfil', details: error.message });
    }
});

router.post('/profile', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
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

module.exports = router;