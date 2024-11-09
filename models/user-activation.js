'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserActivation = sequelize.define('UserActivation', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Establece la fecha actual por defecto
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Establece la fecha actual por defecto
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false, // Obligatorio
        },
        jti: {
            type: DataTypes.TEXT,
            allowNull: false, // Obligatorio
        },
    }, {
        tableName: 'users_activation',
        timestamps: true,
    });

    UserActivation.associate = (models) => {
        UserActivation.belongsTo(models.User, { foreignKey: 'userId' });
    }

    return UserActivation;
};