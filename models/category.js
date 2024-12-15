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
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING(50),
            unique: true,
            allowNull: false
        },
    }, {
        tableName: 'categories',
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
        paranoid: true,     // Habilita automáticamente soft delete (deletedAt)
    });

    return Category;
};