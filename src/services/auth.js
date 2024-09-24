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
    const { email, password} = request.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user)
            response.status(401).json({ message: 'Credenciales inválidas' });

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid)
            response.status(401).json({ message: 'Credenciales inválidas' });

        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION} );
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });
        const jti = uuidv4();

        const expiresIn = jwt.decode(refreshToken).exp * 1000;

        const newRefreshToken = await Session.create({
            userId: user.id,
            token: refreshToken,
            jti: jti,
            expiresIn: expiresIn,
        });

        return response.status(200).json({
            accessToken,
            refreshToken,
            // jti,
            message: 'Inicio de sesión exitoso',
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

module.exports = router;