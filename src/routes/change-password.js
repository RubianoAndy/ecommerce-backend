'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
// const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
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

router.patch('/change-password', authMiddleware, async (request, response) => {
    const userId = request.accessTokenDecoded.id;

    const { currentPassword, newPassword} = request.body;

    if (!currentPassword || !newPassword)
        return response.status(400).json({ message: 'Todos los campos son obligatorios' });

    try {
        const user = await User.findOne({ where: { id: userId }});

        if (!user)
            return response.status(404).json({ message: 'El usuario no existe' });

        if (!user.activated)
            return response.status(403).json({ message: 'El usuario no está activo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        const currentPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!currentPasswordMatch)
            return response.status(400).json({ message: 'La contraseña actual es incorrecta' });

        const newPasswordMatch = await bcrypt.compare(newPassword, user.password);
        if (newPasswordMatch)
            return response.status(400).json({ message: 'La nueva contraseña es igual a la anterior' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

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

        return response.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        logger.error(`Error al actualizar la contraseña: ${error.message}`);
        return response.status(500).json({
            message: 'Error al actualizar la contraseña',
            details: error.message,
        });
    }
});

module.exports = router;