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

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid)
            return response.status(401).json({ message: 'Credenciales inválidas' });

        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        await Session.create({
            userId: user.id,
            token: refreshToken,
            jti: uuidv4(),
            expiresIn: jwt.decode(refreshToken).exp * 1000,
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

router.post('/refresh', async (request, response) => {
    const { refreshToken } = request.body;

    try {
        if (!refreshToken)
            return response.status(401).json({ message:'Token no proporcionado' });

        let refreshTokenDecoded = null;
        try {
            refreshTokenDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            console.error(error);
            return response.status(401).json({ message: 'Token inválido' });
        }

        if (!refreshTokenDecoded || !refreshTokenDecoded.exp)
            return response.status(401).json({ message: 'Token inválido' });

        const currentTime = Math.floor(Date.now() / 1000);
        if (refreshTokenDecoded.exp < currentTime)
            return response.status(401).json({ message: 'Token expirado' });

        const user = await User.findOne({ where: { id: refreshTokenDecoded.id} });
        if (!user)
            return response.status(401).json({ message: 'No existe usuario asociado' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const session = await Session.findOne({ where: { token: refreshToken} });
        if (!session)
            return response.status(401).json({ message: 'No hay sesión iniciada' });

        const blacklistedSession = await Session_Blacklist.findOne({ where: { sessionId: session.id } });
        if (blacklistedSession)
            return response.status(400).json({ message: 'Token inválido' });
        
        const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
        const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        await Session_Blacklist.create({
            sessionId: session.id,
        });

        await Session.create({
            userId: user.id,
            token: newRefreshToken,
            jti: uuidv4(),
            expiresIn: jwt.decode(newRefreshToken).exp * 1000,
        });

        return response.status(201).json({ 
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            message: 'Token renovado satisfactoriamente'
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error al renovar token' });
    }
});

router.post('/logout', async (request, response) => {
    const { refreshToken } = request.body;

    try {
        const session = await Session.findOne({ where: { token: refreshToken } });
        if (!session)
            return response.status(401).json({ message: 'No se pudo cerrar sesión: token inválido' });

        const blacklistedSession = await Session_Blacklist.findOne({ where: { sessionId: session.id }})
        if (blacklistedSession)
            return response.status(400).json({ message: 'La sesión ya estaba cerrada' });

        await Session_Blacklist.create({
            sessionId: session.id,
        });

        return response.status(400).json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error al cerrar sesión' });
    }
});

module.exports = router;