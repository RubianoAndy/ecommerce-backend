'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const { User, Profile, Correspondence } = require('../../models');
const authMiddleware = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/role-middleware');
const { where } = require('sequelize');

const SUPER_ADMIN = Number(process.env.SUPER_ADMIN);

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

router.get('/correspondence', authMiddleware, async (request, response) => {
    const userId = request.accessTokenDecoded.id;

    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });

        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        const correspondence = await Correspondence.findOne({ where: { profileId: profile.id } });
        if (!correspondence)
            return response.status(404).json({ message: 'Información de correspondencia no encontrada' });

        const result = {
            id: correspondence.id,
            countryId: correspondence.countryId,
            departmentId: correspondence.departmentId,
            city: correspondence.city,
            zipCode: correspondence.zipCode,
            address: correspondence.address,
            observations: correspondence.observations,
            message: 'Información de correspondencia cargada exitosamente'
        };

        return response.status(200).json(result);
    } catch (error) {
        logger.error(`Error al obtener la información de correspondencia: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener la información de correspondencia', details: error.message });
    }
});

router.post('/correspondence', authMiddleware, async (request, response) => {
    const userId = request.accessTokenDecoded.id;

    const { countryId, departmentId, city, zipCode, address, observations } = request.body;

    if (!countryId || !departmentId || !city || !zipCode || !address)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });

        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        const correspondence = await Correspondence.findOne({ where: { profileId: profile.id } });
        if (!correspondence) {
            try {
                await Correspondence.create({
                    profileId: profile.id,
                    countryId,
                    departmentId,
                    city,
                    zipCode,
                    address,
                    observations,
                });

                /* const filePath = path.join(__dirname, '../utils/email/activate-account.html');

                try {
                    const htmlContent = await fs.readFile(filePath, 'utf-8');

                    const personalizedHtml = htmlContent
                        .replace('{{ name_1 }}', name_1)
                        .replace('{{ lastname_1 }}', lastname_1)
                        .replace('{{ activateUrl }}', activateUrl)
                        .replace('{{ apiURL }}', process.env.API_URL)
                        .replace('{{ support_email }}', process.env.SUPPORT_EMAIL)
                        .replace('{{ support_number }}', process.env.SUPPORT_WHATSAPP);

                    const mailContent = {
                        // from: `"${name}" <${email}>`,
                        to: email,
                        subject: '¡Activa tu cuenta!',
                        html: personalizedHtml
                    };

                    await transporter.sendMail(mailContent);
                } catch (error) {
                    logger.error(`Error al enviar el correo: ${error.message}`);
                } */

                return response.status(201).json({ message: 'Registro de correspondencia creado satisfactoriamente' });
            } catch (error) {
                logger.error(`No se pudo crear el registro de correspondencia: ${error.message}`);
                return response.status(500).json({ message: 'No se pudo crear el registro de correspondencia', details: error.message });
            }
        } else {
            try {
                await Correspondence.update({
                    countryId,
                    departmentId,
                    city,
                    zipCode,
                    address,
                    observations,
                }, { where: { profileId: profile.id } });
    
                return response.status(200).json({ message: 'Registro de correspondencia actualizado satisfactoriamente' });
            } catch (error) {
                logger.error(`No se pudo actualizar el registro de correspondencia: ${error.message}`);
                return response.status(500).json({ message: 'No se pudo actualizar el registro de correspondencia', details: error.message });
            }
        }
    } catch (error) {
        logger.error(`Error al obtener la información de correspondencia: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener la información de correspondencia', details: error.message });
    }
});

module.exports = router;