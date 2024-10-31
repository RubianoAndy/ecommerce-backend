'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const winston = require('winston');
require('dotenv').config();

const { User, Profile } = require('../../models');

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

router.get('/profile', async (request, response) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return response.status(401).json({ message: 'Token de acceso no proporcionado' });

    const accessToken = authHeader.split(' ')[1];

    let accessTokenDecoded;
    try {
        accessTokenDecoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        logger.error(`Error al verificar el access token: ${error.message}`);
        return response.status(401).json({ message: 'Token de acceso inválido' });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (accessTokenDecoded.exp < currentTime)
        return response.status(401).json({ message: 'Token de acceso expirado' });

    const userId = accessTokenDecoded.id;
    
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

module.exports = router;