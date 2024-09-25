'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { User } = require('../../models');
const { Profile } = require('../../models');
const { Session } = require('../../models');
const { Session_Blacklist } = require('../../models');

const router = express.Router();

router.post('/register', async (request, response) => {
    const { email, password, name_1, lastname_1 } = request.body;

    try {
        const userExist = await User.findOne({ where: { email } });
        if (userExist)
            return response.status(400).json({ message: 'El usuario ya existe' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            email,
            password: hashedPassword,
        });

        const newProfile = await Profile.create({
            name_1,
            lastname_1,
            userId: newUser.id
        });

        return response.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error al registrar el usuario' });
    }
});

router.post('/login', async (request, response) => {
    const { email, password } = request.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user)
            return response.status(401).json({ message: 'Credenciales inválidas' });

        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId: user.id } });
        if (!profile)
            return response.status(401).json({ message: 'Perfil no encontrado' });

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid)
            return response.status(401).json({ message: 'Credenciales inválidas' });

        const accessToken = jwt.sign({ id: user.id, profileId: profile.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
        const refreshToken = jwt.sign({ id: user.id, profileId: profile.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });
        const jti = uuidv4();

        const expiresIn = jwt.decode(refreshToken).exp * 1000;

        await Session.create({
            userId: user.id,
            token: refreshToken,
            jti: jti,
            expiresIn: expiresIn,
        });

        return response.status(200).json({
            accessToken,
            refreshToken,
            message: 'Inicio de sesión exitoso',
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

router.post('/logout', async(request, response) => {
    const { refreshToken } = request.body;

    try {
        const sessionExist = await Session.findOne({ where: { token: refreshToken } });
        if (!sessionExist)
            return response.status(401).json({ message: 'No se pudo cerrar sesión: token inválido' });

        const blacklistedSession = await Session_Blacklist.findOne({ where: { sessionId: sessionExist.id }})
        if (blacklistedSession)
            return response.status(400).json({ message: 'La sesión ya estaba cerrada' });

        await Session_Blacklist.create({
            sessionId: sessionExist.id,
        });

        return response.status(400).json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error al cerrar sesión' });
    }
});

module.exports = router;