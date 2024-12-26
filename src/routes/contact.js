'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: 'error.log' })
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

router.post('/send-contact', async (request, response) => {
    const { name, email, subject, message } = request.body;

    if (!name || !email || !subject || !message)
        return response.status(400).json({ message: 'Todos los campos son obligatorios' });

    if (!validator.isEmail(email))
        return response.status(400).json({ message: 'El formato del correo electrónico no es válido' });

    try {
        const filePath = path.join(__dirname, '../utils/email/contact.html');
        
        const htmlContent = await fs.readFile(filePath, 'utf-8');

        const personalizedHtml = htmlContent
            .replace('{{ message }}', message)
            .replace('{{ name }}', email)
            .replace('{{ email }}', email);

        const mailContent = {
            // from: `"${name}" <${email}>`,
            to: process.env.SUPPORT_EMAIL,
            subject: subject,
            html: personalizedHtml
        };

        await transporter.sendMail(mailContent);

        return response.status(200).json({ message: 'Mensaje enviado' });
    } catch (error) {
        logger.error(error);
        return response.status(500).json({ message: 'Error al enviar el mensaje' });
    }
});

module.exports = router;