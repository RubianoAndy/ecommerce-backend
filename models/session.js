'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Session = sequelize.define('Session', {
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
        tableName: 'sessions',
        timestamps: true,
    });

    Session.associate = (models) => {
        Session.belongsTo(models.User, { foreignKey: 'userId' });
        Session.hasOne(models.SessionBlacklist, { foreignKey: 'sessionId' });
    }

    return Session;
};