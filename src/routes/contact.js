'use strict';

const express = require('express');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const logger = require('../config/logger');
const transporter = require('../config/transporter');
const limiter = require('../config/limiter');

const router = express.Router();

router.post('/send-contact', limiter(5, 15), async (request, response) => {
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
            .replace('{{ name }}', name)
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