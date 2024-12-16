'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const winston = require('winston');
require('dotenv').config();

const { User, Profile } = require('../../models');
const authMiddleware = require('../middlewares/auth-middleware');
// const roleMiddleware = require('../middlewares/role-middleware');

// const SUPER_ADMIN = Number(process.env.SUPER_ADMIN);

// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Se asegura de que el directorio exista
        const uploadDir = path.join(process.cwd(), '../storage-uploads/profile-images');
        
        // Crea directorio si no existe
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err, uploadDir));
    },
    filename: (req, file, cb) => {
        // Generar nombre de archivo único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 3 * 1024 * 1024 // Límite de 3 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Tipo de archivo no permitido'), false);
    }
});

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

const router = express.Router();

router.post('/upload-avatar', authMiddleware, upload.single('profileImage'), async (request, response) => {
    try {
        if (!request.file)
            return response.status(400).json({ message: 'No se ha subido ningún archivo' });

        if (request.file.size > 3 * 1024 * 1024) {
            await fs.unlink(request.file.path); // Eliminar archivo si excede el tamaño
            return response.status(400).json({ message: 'El archivo excede el límite de 3MB' });
        }

        /* const userProfile = await Profile.findOne({ 
            where: { userId: request.user.id } 
        }); */

        // Eliminar imagen anterior si existe
        /* if (userProfile && userProfile.avatar) {
            const oldImagePath = path.join('../storage-uploads/profile-images', userProfile.avatar);
            try {
                await fs.access(oldImagePath);
                await fs.unlink(oldImagePath);
            } catch (error) {
                logger.warn(`Imagen anterior no encontrada: ${oldImagePath}`);  // Si el archivo no existe, no hacer nada
            }
        } */

        /* await Profile.update(
            { avatar: request.file.filename }, 
            { where: { userId: request.user.id } }
        ); */
    
        return response.status(200).json({
            message: 'Imagen de perfil cargada exitosamente',
            filename: request.file.filename,
            path: request.file.path
        });
    } catch (error) {
        logger.error(`Error al cargar la imagen perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al cargar la imagen perfil', details: error.message });
    }
});

router.get('/profile', authMiddleware, async (request, response) => {
    const userId = request.accessTokenDecoded.id;       // Se decodifica en el authMiddleware
    
    try {
        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        const result = {
            id: profile.id,
            name_1: profile.name_1,
            name_2: profile.name_2,
            lastname_1: profile.lastname_1,
            lastname_2: profile.lastname_2,
            dniType: profile.dniType,
            dni: profile.dni,
            prefix: profile.prefix,
            mobile: profile.mobile,
            email: user.email,

            message: 'Perfil cargado exitosamente',
        };
        
        return response.status(200).json(result);
    } catch (error) {
        logger.error(`Error al obtener el perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al obtener el perfil', details: error.message });
    }
});

router.put('/profile', authMiddleware, async (request, response) => {
    const userId = request.accessTokenDecoded.id;

    const { name_2, lastname_2, dniType, dni, prefix, mobile } = request.body;

    if (!prefix || !mobile)
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

        profile.prefix = prefix;
        profile.mobile = mobile;

        // Son obligatorios pero con disable en el formulario
        if(dniType)
            profile.dniType = dniType;
        
        if (dni)
            profile.dni = dni;

        // Estos son campos opcionales, por eso se coloca el else
        if (name_2)
            profile.name_2 = name_2;
        else
            profile.name_2 = null;
        
        if (lastname_2)
            profile.lastname_2 = lastname_2;
        else
            profile.lastname_2 = null;

        await profile.save();

        const result = {
            id: profile.id,
            name_1: profile.name_1,
            name_2: profile.name_2,
            lastname_1: profile.lastname_1,
            lastname_2: profile.lastname_2,
            dniType: profile.dniType,
            dni: profile.dni,
            prefix: profile.prefix,
            mobile: profile.mobile,
            email: user.email,

            message: 'Perfil actualizado exitosamente',
        };

        return response.status(200).json(result);

    } catch (error) {
        logger.error(`Error al actualizar la información del perfil: ${error.message}`);
        return response.status(500).json({ message: 'Error al actualizar la información del perfil', details: error.message });
    }
});

module.exports = router;