'use strict';

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const logger = require('../config/logger');

const { User, Profile } = require('../../models');
const authMiddleware = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/role-middleware');

const SUPER_ADMIN = Number(process.env.SUPER_ADMIN);
// const ADMIN = Number(process.env.ADMIN);

const AVATAR_PATH = process.env.AVATAR_PATH;

/* const storage = multer.diskStorage({
    destination: async (request, file, cb) => {
        const uploadDir = path.join(process.cwd(), AVATAR_PATH);
        
        try {
            if (!await fs.access(uploadDir).then(() => true).catch(() => false))
                await fs.mkdir(uploadDir, { recursive: true });
            
            cb(null, uploadDir);
        } catch (error) {
            cb(new Error('Error al crear el directorio de carga'), false);
        }
    },
    filename: (request, file, cb) => {
        const userId = request.accessTokenDecoded.id;
        const uniquePrefix = `User-${userId}-Avatar-${Date.now()}`;
        const extension = path.extname(file.originalname);
        cb(null, `${uniquePrefix}${extension}`);
    }
}); */

const storage = multer.memoryStorage(); // Almacenamiento en memoria

const upload = multer({
    storage: storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // Límite de 3 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Tipo de archivo no permitido'), false);
    }
});

const router = express.Router();

const deleteOldAvatar = async (avatarPath) => {
    try {
        await fs.access(avatarPath); // Verifica si el archivo existe
        await fs.unlink(avatarPath); // Elimina el archivo
    } catch (error) {
        logger.error(`Error al eliminar el avatar: ${error.message}`);
    }
};

router.post('/avatar', authMiddleware, upload.single('profileImage'), async (request, response) => {
    const userId = request.accessTokenDecoded.id;

    try {
        if (!request.file)
            return response.status(400).json({ message: 'No se ha subido ningún archivo' });

        if (!request.file.buffer || request.file.buffer.length === 0)
            return response.status(400).json({ message: 'El archivo está vacío o no se ha cargado correctamente' });

        const user = await User.findOne({ where: { id: userId } });
        if (!user)
            return response.status(404).json({ message: 'No existe usuario asociado' });
        
        if (!user.activated)
            return response.status(403).json({ message: 'Usuario inactivo' });

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        if (profile.avatar) {
            const oldAvatarPath = path.join(process.cwd(), AVATAR_PATH, profile.avatar);
            await deleteOldAvatar(oldAvatarPath);
        }

        const outputFilePath = path.join(process.cwd(), AVATAR_PATH, `User-${userId}-Avatar-${Date.now()}.webp`);

        await sharp(request.file.buffer)
            .resize(500, 500)
            .toFormat('webp', { quality: 80 })
            .toFile(outputFilePath);

        await profile.update(
            { avatar: path.basename(outputFilePath) }, 
            { where: { userId } }
        );
    
        return response.status(200).json({
            message: 'Imagen de perfil procesada y guardada exitosamente',
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

        let imagePath;
        if (!profile.avatar)
            imagePath = path.resolve(process.cwd(), 'public', 'assets', 'images', 'avatar', 'Avatar.png');
        else
            imagePath = path.resolve(process.cwd(), AVATAR_PATH, profile.avatar);

        if (!await fs.access(imagePath).then(() => true).catch(() => false))
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

router.get('/avatar/:userId', authMiddleware, roleMiddleware([ SUPER_ADMIN ]), async (request, response) => {
    try {
        const userId = request.params.userId;
        
        const profile = await Profile.findOne({ 
            where: { userId },
            include: [{
                model: User,
                where: { activated: true },
                required: true
            }]
        });

        if (!profile)
            return response.status(404).json({ message: 'Perfil no encontrado' });

        let imagePath;
        if (!profile.avatar)
            imagePath = path.resolve(process.cwd(), 'public', 'assets', 'images', 'avatar', 'Avatar.png');
        else
            imagePath = path.resolve(process.cwd(), AVATAR_PATH, profile.avatar);

        if (!await fs.access(imagePath).then(() => true).catch(() => false))
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