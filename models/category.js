'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false,
            validate: {
                is: {
                    args: /^[a-z0-9]+(-[a-z0-9]+)*$/,
                    msg: 'La URL debe estar en minúsculas y puede contener números y guiones.'
                }
            }
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        observations: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        image: {
            type: DataTypes.TEXT,
            allowNull: false
        },
    }, {
        tableName: 'categories',
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
        paranoid: true,     // Habilita automáticamente soft delete (deletedAt)
    });

    Category.associate = (models) => {
        Category.hasMany(models.Product, { foreignKey: 'categoryId' });
    };

    return Category;
};