'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const winston = require('winston');
require('dotenv').config();

const { User, Profile, PasswordResetCode } = require('../../models');

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
            return response.status(403).json({ message: 'El usuario no existe' });
        
        if (!user.activated)
            return response.status(400).json({ message: 'El usuario no está activo' });

        const profile = await Profile.findOne({ where: { userId: user.id } })
        if (!profile)
            return response.status(403).json({ message: 'El usuario no tiene perfil asociado' });

        const digits = 7;
        let code = '', isUnique = false;
        
        while (!isUnique) {
            code = Math.floor(Math.random() * 10000000).toString().padStart(digits, '0');
            const existingCode = await PasswordResetCode.findOne({ where: {code} });
            isUnique = !existingCode;
        }

        const expirationTime = 15;  // Minutes
        await PasswordResetCode.create({
            code,
            userId: user.id,
            expiresIn: new Date(Date.now() + 1000 * 60 * expirationTime),
        });

        const filePath = path.join(__dirname, '../utils/email/password-generate-code.html');

        try {
            const htmlContent = await fs.readFile(filePath, 'utf-8');

            const personalizedHtml = htmlContent
                .replace('{{ name_1 }}', profile.name_1)
                .replace('{{ lastname_1 }}', profile.lastname_1)
                .replace('{{ apiURL }}', process.env.API_URL)
                .replace('{{ expirationTime }}', expirationTime)
                .replace('{{ code }}', code);
            
            const mailContent = {
                // from: `"${name}" <${email}>`,
                to: email,
                subject: `¡Recupera tu cuenta!`,
                html: personalizedHtml
            };
            await transporter.sendMail(mailContent);
        } catch (error) {
            logger.error(`Error al enviar el correo: ${error.message}`);
        }

        response.status(201).json({ message: 'Código generado satisfactoriamente' });

    } catch (error) {
        logger.error(`Error al generar el código: ${error.message}`);
        return response.status(500).json({
            message: 'Error al generar el código',
            details: error.message,
        });
    }
});

module.exports = router;