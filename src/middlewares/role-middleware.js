'use strict';

const jwt = require('jsonwebtoken');
const winston = require('winston');
require('dotenv').config();

const { User } = require('../../models');

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

const roleMiddleware = (allowedRoles) => {
    return async (request, response, next) => {
        try {
            const userId = request.accessTokenDecoded?.id;      // accessTokenDecoded debe ser el mismo del auth-middleware

            if (!userId)
                return response.status(403).json({ message: 'ID de usuario no proporcionado' });
            
            const user = await User.findOne({ where: { id: userId } });
            if (!user)
                return response.status(404).json({ message: 'No existe usuario asociado' });
            
            if (!user.activated)
                return response.status(403).json({ message: 'Usuario inactivo' });
            
            const roleId = Number(user.roleId);

            if (!allowedRoles.includes(roleId)) {
                logger.error('Acceso denegado');
                return response.status(403).json({ message: 'Acceso denegado'});
            }

            next();
        } catch (error) {
            logger.error(`Error al verificar el rol: ${error.message}`);
            return response.status(500).json({ message: 'Error al verificar el rol', details: error.message });
        }
    };
};

module.exports = roleMiddleware;