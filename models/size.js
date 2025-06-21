'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Size = sequelize.define('Size', {
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
        description: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
    }, {
        tableName: 'sizes',
        timestamps: false,
    });

    return Size;
};