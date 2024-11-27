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
            return response.status(404).json({ message: 'El usuario no existe' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'El usuario no está activo' });

        const profile = await Profile.findOne({ where: { userId: user.id } })
        if (!profile)
            return response.status(404).json({ message: 'El usuario no tiene perfil asociado' });

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
                .replace('{{ code }}', code)
                .replace('{{ support_number }}', process.env.SUPPORT_WHATSAPP);
            
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

        response.status(201).json({ 
            message: 'Código generado satisfactoriamente',
            userId: user.id,
        });

    } catch (error) {
        logger.error(`Error al generar el código: ${error.message}`);
        return response.status(500).json({
            message: 'Error al generar el código',
            details: error.message,
        });
    }
});

router.post('/verify-code', async (request, response) => {
    const {userId, code, password} = request.body;

    if (!userId || !code || !password)
        return response.status(400).json({ message: 'Todos los campos son obligatorios' });

    try {
        const user = await User.findOne({ where: { id: userId } })
        if (!user)
            return response.status(404).json({ message: 'El usuario no existe' });

        if (!user.activated)
            return response.status(403).json({ message: 'El usuario no está activo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        const savedCode = await PasswordResetCode.findOne({ where: { code, userId } });
        if (!savedCode)
            return response.status(404).json({ message: 'No existe un código asociado al usuario solicitado' });

        const currentTime = new Date();
        if (currentTime > savedCode.expiresIn) {
            await PasswordResetCode.destroy({ where: { userId } });
            return response.status(400).json({ message: 'Código vencido' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        /* await User.update(
            { password: hashedPassword },
            { where : {id: userId} },
        ); */

        user.password = hashedPassword;
        await user.save();

        await PasswordResetCode.destroy({ where: { userId } });

        const filePath = path.join(__dirname, '../utils/email/password-changed-notification.html');

        try {
            const htmlContent = await fs.readFile(filePath, 'utf-8');

            const personalizedHtml = htmlContent
                .replace('{{ name_1 }}', profile.name_1)
                .replace('{{ lastname_1 }}', profile.lastname_1)
                .replace('{{ email }}', user.email)
                .replace('{{ support_email }}', process.env.SUPPORT_EMAIL)
                .replace('{{ support_number }}', process.env.SUPPORT_WHATSAPP);
            
            const mailContent = {
                // from: `"${name}" <${email}>`,
                to: user.email,
                subject: `¡Cambio de contraseña exitoso!`,
                html: personalizedHtml
            };
            await transporter.sendMail(mailContent);
        } catch (error) {
            logger.error(`Error al enviar el correo: ${error.message}`);
        }

        return response.status(200).json({ message: 'Contraseña cambiada exitosamente' });
    } catch (error) {
        logger.error(`Error al comprobar el código: ${error.message}`);
        return response.status(500).json({
            message: 'Error al comprobar el código',
            details: error.message,
        });
    }
});

module.exports = router;