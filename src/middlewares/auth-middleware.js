'use strict';

const jwt = require('jsonwebtoken');
const winston = require('winston');
require('dotenv').config();

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

const authMiddleware = (request, response, next) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return response.status(401).json({ message: 'Token de acceso no proporcionado' });

    const accessToken = authHeader.split(' ')[1];

    try {
        const accessTokenDecoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        request.accessTokenDecoded = accessTokenDecoded;
        next();
    } catch (error) {
        logger.error(`Error al verificar el access token: ${error.message}`);
        return response.status(401).json({ message: 'Token de acceso inválido' });
    }
};

module.exports = authMiddleware;