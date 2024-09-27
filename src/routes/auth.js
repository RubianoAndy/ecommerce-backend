'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
require('dotenv').config();

const { User, Session, SessionBlacklist } = require('../../models');

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

router.post('/login', async (request, response) => {
    const { email, password } = request.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user)
            return response.status(401).json({ message: 'Credenciales inválidas' });

        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid)
            return response.status(401).json({ message: 'Credenciales inválidas' });

        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        await Session.create({
            userId: user.id,
            token: refreshToken,
            jti: uuidv4(),
        });

        return response.status(200).json({
            accessToken,
            refreshToken,
            message: 'Inicio de sesión exitoso',
        });
    } catch (error) {
        logger.error(`Error al iniciar sesión: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al iniciar sesión',
            details: error.message,
        });
    }
});

router.post('/refresh', async (request, response) => {
    const { refreshToken } = request.body;

    try {
        if (!refreshToken)
            return response.status(401).json({ message:'Token no proporcionado' });

        let refreshTokenDecoded = null;
        try {
            refreshTokenDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            logger.error(`Error al verificar el refresh token: ${error.message}`);
            return response.status(401).json({ message: 'Token inválido' });
        }

        if (!refreshTokenDecoded || !refreshTokenDecoded.exp)
            return response.status(401).json({ message: 'Token inválido' });

        const currentTime = Math.floor(Date.now() / 1000);
        if (refreshTokenDecoded.exp < currentTime)
            return response.status(401).json({ message: 'Token expirado' });

        const user = await User.findOne({ where: { id: refreshTokenDecoded.id} });
        if (!user)
            return response.status(401).json({ message: 'No existe usuario asociado' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const session = await Session.findOne({ where: { token: refreshToken} });
        if (!session)
            return response.status(401).json({ message: 'No hay sesión iniciada' });

        const blacklistedSession = await Session_Blacklist.findOne({ where: { sessionId: session.id } });
        if (blacklistedSession)
            return response.status(400).json({ message: 'Token inválido' });
        
        const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
        const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        await Session_Blacklist.create({
            sessionId: session.id,
        });

        await Session.create({
            userId: user.id,
            token: newRefreshToken,
            jti: uuidv4(),
        });

        return response.status(201).json({ 
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            message: 'Token renovado satisfactoriamente'
        });
    } catch (error) {
        logger.error(`Error al renovar token: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al renovar token',
            details: error.message,
        });
    }
});

router.post('/logout', async (request, response) => {
    const { refreshToken } = request.body;

    try {
        const session = await Session.findOne({ where: { token: refreshToken } });
        if (!session)
            return response.status(401).json({ message: 'No se pudo cerrar sesión: token inválido' });

        const blacklistedSession = await Session_Blacklist.findOne({ where: { sessionId: session.id }})
        if (blacklistedSession)
            return response.status(400).json({ message: 'La sesión ya estaba cerrada' });

        await Session_Blacklist.create({
            sessionId: session.id,
        });

        return response.status(400).json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        logger.error(`Error al cerrar sesión: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al cerrar sesión',
            details: error.message,
        });
    }
});

module.exports = router;