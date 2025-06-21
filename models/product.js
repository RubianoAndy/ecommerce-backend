'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        categoryId: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING(150),
            unique: true,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(1000),
            allowNull: false
        },
        observations: {
            type: DataTypes.STRING(1000),
            allowNull: true
        },
    }, {
        tableName: 'products',
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
        paranoid: true,     // Habilita automáticamente soft delete (deletedAt)
    });

    Product.associate = (models) => {
        Product.belongsTo(models.Category, { foreignKey: 'categoryId' });
    };

    return Product;
};