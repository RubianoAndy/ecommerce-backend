'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');
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

router.post('/register', async (request, response) => {
    const { email, password, name_1, lastname_1 } = request.body;

    if (!email || !password || !name_1 || !lastname_1)
        return response.status(400).json({ message: 'Todos los campos son obligatorios' });

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
        });

        await Profile.create({
            name_1,
            lastname_1,
            userId: newUser.id
        });

        const filePath = path.join(__dirname, '../utils/email/register.html');

        try {
            const htmlContent = await fs.readFile(filePath, 'utf-8');

            const personalizedHtml = htmlContent
                .replace('{{ name_1 }}', name_1)
                .replace('{{ lastname_1 }}', lastname_1)
                .replace('{{ email }}', email)
                .replace('{{ apiURL }}', process.env.API_URL);

            const mailContent = {
                // from: `"${name}" <${email}>`,
                to: email,
                subject: `¡Bienvenido(a) ${name_1}!`,
                html: personalizedHtml
            };

            await transporter.sendMail(mailContent);
        } catch (error) {
            logger.error(`Error al enviar el correo: ${error.message}`);
        }

        return response.status(201).json({ message: 'Revisa tu correo electrónico' });
    } catch (error) {
        logger.error(`Error al registrar el usuario: ${error.message}`);
        return response.status(500).json({
            message: 'Error al registrar el usuario',
            details: error.message,
        });
    }
});

module.exports = router;