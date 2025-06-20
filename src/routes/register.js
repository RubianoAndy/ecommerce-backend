'use strict';

const express = require('express');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const logger = require('../config/logger');
const transporter = require('../config/transporter');

const { User, Profile, UserActivation } = require('../../models');

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
            roleId: Number(process.env.CUSTOMER),  // Id para clientes
        });

        await Profile.create({
            name_1,
            lastname_1,
            userId: newUser.id
        });

        const jti = uuidv4();
        const token = jwt.sign({ id: newUser.id, jti: jti }, process.env.JWT_ACTIVATION_SECRET, { expiresIn: process.env.JWT_ACTIVATION_EXPIRATION });
        const activateUrl = `${process.env.API_URL}/activate?token=${token}`;

        await UserActivation.create({
            userId: newUser.id,
            token,
            jti,
        })

        const filePath = path.join(__dirname, '../utils/email/activate-account.html');

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

router.post('/activate', async (request, response) => {
    const { token } = request.body;

    try {
        if (!token)
            return response.status(401).json({ message: 'Enlace de activación inválido' });

        let tokenDecoded = null;
        try {
            tokenDecoded = jwt.verify(token, process.env.JWT_ACTIVATION_SECRET);
        } catch (error) {
            logger.error(`Error al verificar el token: ${error.message}`);
            return response.status(401).json({ message: 'Link inválido' });
        }

        const activationRecord = await UserActivation.findOne({ where: { token } });
        if (!activationRecord)
            return response.status(401).json({ message: 'No existe un token de activación' });

        if (activationRecord.jti !== tokenDecoded.jti)
            return response.status(401).json({ message: 'Token manipulado' });

        if (activationRecord.userId != tokenDecoded.id)
            return response.status(401).json({ message: 'El token de activación no coincide con el usuario solicitado' });

        const user = await User.findOne({ where: { id: tokenDecoded.id } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        if (user.activated)
            return response.status(403).json({ message: 'El usuario ya está activado' });

        const profile = await Profile.findOne({ where: { userId: user.id } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        await User.update(
            { activated: true },
            { where : {id: tokenDecoded.id} },
        );

        await UserActivation.destroy({ where: { userId: user.id } });

        const filePath = path.join(__dirname, '../utils/email/welcome-account.html');

        try {
            const htmlContent = await fs.readFile(filePath, 'utf-8');

            const personalizedHtml = htmlContent
                .replace('{{ name_1 }}', profile.name_1)
                .replace('{{ lastname_1 }}', profile.lastname_1)
                .replace('{{ apiURL }}', process.env.API_URL)
                .replace('{{ email }}', user.email);

            const mailContent = {
                // from: `"${name}" <${email}>`,
                to: user.email,
                subject: '¡Bienvenido(a)!',
                html: personalizedHtml
            };

            await transporter.sendMail(mailContent);
        } catch (error) {
            logger.error(`Error al enviar el correo: ${error.message}`);
        }
        
        return response.status(201).json({ message: 'Cuenta activada satisfactoriamente' });
    } catch (error) {
        logger.error(`Error al renovar token: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al renovar token',
            details: error.message,
        });
    }
});

module.exports = router;