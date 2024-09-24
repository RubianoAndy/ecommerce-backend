'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { User } = require('../../models');
const { Profile } = require('../../models');

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
        console.error(error); // Registrar el error en la consola para depuración
        return response.status(500).json({ message: 'Error al registrar el usuario' });
    }
});

module.exports = router;