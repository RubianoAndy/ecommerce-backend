'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
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

router.post('/register', async (request, response) => {
    const { email, password, name_1, lastname_1 } = request.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (user)
            return response.status(400).json({ message: 'El usuario ya existe' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword,
        });

        await Profile.create({
            name_1,
            lastname_1,
            userId: newUser.id
        });

        return response.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        logger.error(`Error al registrar el usuario:${error.message}`);
        return response.status(500).json({ 
            message: 'Error al registrar el usuario',
            details: error.message,
        });
    }
});

module.exports = router;