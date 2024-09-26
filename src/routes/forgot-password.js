'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
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

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,  // Set to true if port 465 is used
    auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
    }
});

const router = express.Router();

router.post('/generate-code', async (request, response) => {
    const { email } = request.body;

    if (!email)
        return response.status(400).json({ message: 'Todos los campos son obligatorios' });

    if (!validator.isEmail(email))
        return response.status(400).json({ message: 'El formato del correo electrónico no es válido' });

    try {
        const user = await User.findOne({ where: { email } });
        if (!user)
            return response.status(400).json({ message: 'El usuario no existe' });



    } catch (error) {
        logger.error(`Error al generar el código: ${error.message}`);
        return response.status(500).json({
            message: 'Error al generar el código',
            details: error.message,
        });
    }
});

module.exports = router;