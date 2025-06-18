'use strict';

const express = require('express');
const { Sequelize } = require('sequelize');
const ExcelJS = require('exceljs');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const logger = require('../config/logger');

const { Category } = require('../../models');

const authMiddleware = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/role-middleware');

const SUPER_ADMIN = Number(process.env.SUPER_ADMIN);
const ADMIN = Number(process.env.ADMIN);

const CATEGORY_PATH = process.env.CATEGORY_PATH;

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Límite de 2 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error('Tipo de archivo no permitido. Solo se permiten PNG, JPEG, y WEBP.'), false);
    }
});

const router = express.Router();

router.get('/categories', authMiddleware, roleMiddleware([ SUPER_ADMIN, ADMIN ]), async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const pageSize = parseInt(request.query.pageSize) || 10;

        const offset = (page - 1) * pageSize;

        let filters = {};

        try {
            filters = request.query.filters ? JSON.parse(request.query.filters) : [];
        } catch (error) {
            logger.error(`Error en el formato de los filtros: ${error.message}`);
            return response.status(400).json({ message: 'Error en el formato de los filtros' });
        }

        let filterConditions = {};

        filters.forEach(filter => {
            if (filter.field && filter.value !== undefined) {
                if (filter.field === 'id') {
                    const id = parseInt(filter.value, 10);
                    if (!isNaN(id))
                        filterConditions.id = { [Sequelize.Op.eq]: id };
                    else {
                        logger.error(`Valor no válido para id: ${filter.value}`);
                        return response.status(400).json({ message: 'El valor del ID debe ser un número' });
                    }
                } else if (filter.field === 'name') {
                    const searchTerm = filter.value.toLowerCase().trim();
                    filterConditions.name = { [Sequelize.Op.iLike]: `%${searchTerm}%` };
                }
            }
        });

        const query = {
            attributes: [
                'id',
                'createdAt',
                'updatedAt',
                'name',
                'url',
                // 'description',
                // 'observations',
                // 'image',
            ],
            where: filterConditions,
            limit: pageSize,
            offset: offset,
            include: [],
            order: [
                ['id', 'ASC']
            ]
        };

        const categories = await Category.findAll(query);       // Ignora los que tienen deleteAt diferente de null

        /* const categoriesWithImageUrls = categories.map(category => {
            const categoryData = category.toJSON();
            if (categoryData.image)
                categoryData.imageUrl = `${process.env.BASE_URL}${CATEGORY_PATH}/${categoryData.image}`;
            
            return categoryData;
        }); */

        const totalCategories = await Category.count({
            where: filterConditions,
            include: []
        });

        const totalPages = Math.ceil(totalCategories / pageSize);
        
        return response.status(200).json({
            categories: categories,         // categoriesWithImageUrls,
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalCategories,
            message: 'Categorías cargadas exitosamente!'
        });
    } catch (error) {
        logger.error(`Error al obtener las categorías: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al obtener las categorías',
            details: error.message,
        });
    }
});

router.get('/category/:categoryId', authMiddleware, roleMiddleware([ SUPER_ADMIN, ADMIN ]), async (request, response) => {
    const categoryId = request.params.categoryId;

    if (isNaN(categoryId) || categoryId <= 0)
        return response.status(400).json({ message: 'ID de la categoría inválido' });

    try {
        const category = await Category.findOne({ 
            where: { id: categoryId }, 
            attributes: ['id', 'name', 'url', 'description', 'observations', 'image'] 
        });

        if (!category)
            return response.status(404).json({ message: 'Categoría no encontrada' });

        const categoryData = category.toJSON();
        if (categoryData.image)
            categoryData.imageUrl = `${process.env.BASE_URL}${CATEGORY_PATH}/${categoryData.image}`;

        return response.status(200).json({
            category: categoryData,
            message: 'Categoría cargada exitosamente'
        });
    } catch (error) {
        logger.error(`Error al obtener la categoría: ${error.message}`);
        return response.status(500).json({
            message: 'Error al obtener la categoría',
            details: error.message,
        });
    }
});

router.get('/category-image/:categoryId', authMiddleware, roleMiddleware([ SUPER_ADMIN, ADMIN ]), async (request, response) => {
    try {
        const categoryId = request.params.categoryId;
        
        const category = await Category.findByPk(categoryId);

        if (!category)
            return response.status(404).json({ message: 'Categoría no encontrada' });

        if (!category.image)
            return response.status(404).json({ message: 'Imagen de categoría no encontrada' });
        
        const imagePath = path.resolve(process.cwd(), CATEGORY_PATH, category.image);
        
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
        logger.error(`Error al recuperar la imagen: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al recuperar la imagen de la categoría', 
            details: error.message 
        });
    }
});

router.post('/category', authMiddleware, roleMiddleware([ SUPER_ADMIN, ADMIN ]), upload.single('image'), async (request, response) => {
    const { name, url, description, observations } = request.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    if (!request.file)
        return response.status(400).json({ message: 'La imagen es requerida' });

    try {
        // Asegurar que existe el directorio
        const uploadDir = path.join(process.cwd(), CATEGORY_PATH);
        await fs.mkdir(uploadDir, { recursive: true });

        const uniqueSuffix = `category-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const extension = '.webp';
        const filename = `${uniqueSuffix}${extension}`;
        const filepath = path.join(uploadDir, filename);

        await sharp(request.file.buffer)
            .webp({ quality: 80 })
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFile(filepath);

        const category = await Category.create({
            name,
            url,
            description,
            observations,
            image: filename
        });

        return response.status(201).json({ 
            message: 'Categoría creada satisfactoriamente',
            // category
        });
    } catch (error) {
        logger.error(`Error al crear la categoría: ${error.message}`);
        return response.status(500).json({
            message: 'Error al crear la categoría',
            details: error.message,
        });
    }
});

router.put('/category/:categoryId', authMiddleware, roleMiddleware([ SUPER_ADMIN, ADMIN ]), upload.single('image'), async (request, response) => {
    const categoryId = request.params.categoryId;

    if (isNaN(categoryId) || categoryId <= 0)
        return response.status(400).json({ message: 'ID de la categoría inválido' });

    const { name, url, description, observations } = request.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0)
        return response.status(400).json({ message: 'Los campos obligatorios están incompletos' });

    try {
        const category = await Category.findOne({ where: { id: categoryId }});
        if (!category)
            return response.status(404).json({ message: 'No existe categoría asociada' });

        let filename = category.image;
        if (request.file) {
            // Eliminar imagen anterior si existe
            if (category.image) {
                const oldImagePath = path.join(process.cwd(), CATEGORY_PATH, category.image);
                await fs.unlink(oldImagePath).catch(() => {});
            }
            // Guardar nueva imagen
            const uniqueSuffix = `category-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            const extension = '.webp';
            filename = `${uniqueSuffix}${extension}`;
            const uploadDir = path.join(process.cwd(), CATEGORY_PATH);
            await fs.mkdir(uploadDir, { recursive: true });
            const filepath = path.join(uploadDir, filename);
            await sharp(request.file.buffer)
                .webp({ quality: 80 })
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .toFile(filepath);
        }

        category.name = name;
        category.url = url;
        category.description = description;
        category.observations = observations;
        category.image = filename;
        await category.save();

        return response.status(200).json({ message: 'Categoría actualizada satisfactoriamente' });
    } catch (error) {
        logger.error(`Error al actualizar la categoría: ${error.message}`);
        return response.status(500).json({
            message: 'Error al actualizar la categoría',
            details: error.message,
        });
    }
});

router.delete('/category/:categoryId', authMiddleware, roleMiddleware([ SUPER_ADMIN, ADMIN ]), async (request, response) => {
    const { categoryId } = request.params;
    if (isNaN(categoryId) || categoryId <= 0)
        return response.status(400).json({ message: 'ID de la categoría inválido' });

    if (!categoryId)
        return response.status(400).json({ message: 'No se ha proporcionado una categoría' });

    try {
        const category = await Category.findOne( { where : { id: categoryId }});

        if (!category)
            return response.status(404).json({ message: 'Categoría no encontrada' });

        if (category.deletedAt)
            return response.status(403).json({ message: 'La categoría ya había sido eliminada' });

        // Eliminar imagen asociada si existe
        if (category.image) {
            const imagePath = path.join(process.cwd(), CATEGORY_PATH, category.image);
            await fs.unlink(imagePath).catch(() => {});
        }

        await category.destroy();       // No destruye el registro si el modelo tiene paranoid en true (soft delete)

        return response.status(200).json({ message: 'Categoría eliminada satisfactoriamente' });

    } catch (error) {
        logger.error(`Error al eliminar la categoría: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al eliminar la categoría',
            details: error.message,
        });
    }
});

router.get('/categories-small', async (request, response) => {
    try {
        // Ignora los que tienen deleteAt diferente de null
        const categories = await Category.findAll({ 
            attributes: ['id', 'name', 'url'],
            order: [['name', 'ASC']]
        });
        
        return response.status(200).json(categories);
    } catch (error) {
        logger.error(`Error al obtener las categorías: ${error.message}`);
        return response.status(500).json({ 
            message: 'Error al obtener las categorías',
            details: error.message,
        });
    }
});

router.get('/categories/excel', authMiddleware, roleMiddleware([ SUPER_ADMIN, ADMIN ]), async (request, response) => {
    try {
        const categories = await Category.findAll({
            order: [['id', 'ASC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Categorías');

        worksheet.columns = [
            { header: 'Categoría ID', key: 'categoryId', width: 15 },
            { header: 'Fecha de creación', key: 'createdAt', width: 20 },
            { header: 'Fecha de actualización', key: 'updatedAt', width: 20 },
            { header: 'Nombre', key: 'name', width: 20 },
        ];

        categories.forEach(category => {

            worksheet.addRow({
                categoryId: category.id,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
                name: category.name,
            });
        });

        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader('Content-Disposition', `attachment; filename=Categorías.xlsx`);

        await workbook.xlsx.write(response);
    } catch (error) {
        logger.error(`Error al generar el archivo Excel de categorías: ${error.message}`);
        return response.status(500).json({ message: 'Error al generar el archivo Excel de categorías', details: error.message });
    }
});

module.exports = router;