'use strict';

const express = require('express');
const winston = require('winston');
require('dotenv').config();

const { User, Profile } = require('../../models');
const authMiddleware = require('../middlewares/auth-middleware');

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
            roleId: user.roleId,

            message: 'Perfil cargado exitosamente',
        };
        
        return response.status(200).json(result);
    } catch (error) {
        logger.error(`Error al obtener el perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener el perfil', details: error.message });
    }
});

module.exports = router;