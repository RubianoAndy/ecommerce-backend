'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        name: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
        },
    }, {
        tableName: 'roles',
        timestamps: true,
        paranoid: true, // Habilita soft deletes de forma automática
    });

    Role.associate = (models) => {
        Role.hasMany(models.User, { foreignKey: 'roleId' });
    };

    return Role;
};