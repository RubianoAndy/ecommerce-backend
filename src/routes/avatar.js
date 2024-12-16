'use strict';

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

const { User, Profile } = require('../../models');
const authMiddleware = require('../middlewares/auth-middleware');

const AVATAR_PATH = process.env.AVATAR_PATH;

const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        const uploadDir = path.join(process.cwd(), AVATAR_PATH);
        
        if (!fs.existsSync(uploadDir))
            fs.mkdirSync(uploadDir, { recursive: true });

        cb(null, uploadDir);
    },
    filename: (request, file, cb) => {
        const userId = request.accessTokenDecoded.id;
        const uniquePrefix = `User-${userId}-Avatar-${Date.now()}`;
        const extension = path.extname(file.originalname);
        cb(null, `${uniquePrefix}${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 3 * 1024 * 1024 // Límite de 3 MB
    },
    fileFilter: (request, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: 'error.log' })
    ]
});

const router = express.Router();

const deleteOldAvatar = (avatarPath) => {
    try {
        if (fs.existsSync(avatarPath))
            fs.unlinkSync(avatarPath);
    } catch (error) {
        logger.error(`Error al eliminar el avatar: ${error.message}`);
    }
};

router.post('/avatar', authMiddleware, upload.single('profileImage'), async (request, response) => {
    const userId = request.accessTokenDecoded.id;

    try {
        if (!request.file)
            return response.status(400).json({ message: 'No se ha subido ningún archivo' });

        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        // Eliminar avatar anterior si existe
        if (profile.avatar) {
            const oldAvatarPath = path.join(process.cwd(), AVATAR_PATH, profile.avatar);
            deleteOldAvatar(oldAvatarPath);
        }

        await profile.update(
            { avatar: request.file.filename }, 
            { where: { userId } }
        );
    
        return response.status(200).json({
            message: 'Imagen de perfil cargada exitosamente',
            // filename: request.file.filename
        });
    } catch (error) {
        logger.error(`Error al cargar avatar: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al cargar la imagen de perfil', 
            details: error.message 
        });
    }
});

router.get('/avatar', authMiddleware, async (request, response) => {
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

        if (!profile.avatar)
            return response.status(404).json({ message: 'Imagen de perfil no encontrada' });

        const imagePath = path.resolve(process.cwd(), AVATAR_PATH, profile.avatar);

        if (!fs.existsSync(imagePath))
            return response.status(404).json({ message: 'Archivo de imagen no encontrado' });

        response.sendFile(imagePath, (error) => {
            if (error) {
                logger.error(`Error al enviar imagen: ${error.message}`);
                return response.status(500).json({ 
                    message: 'Error al enviar la imagen', 
                    details: error.message 
                });
            }
        });
    } catch (error) {
        logger.error(`Error al recuperar avatar: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al recuperar la imagen de perfil', 
            details: error.message 
        });
    }
});

module.exports = router;