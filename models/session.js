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
        userId: {
            type: DataTypes.BIGINT,
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
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
    });

    Session.associate = (models) => {
        Session.belongsTo(models.User, { foreignKey: 'userId' });
        Session.hasOne(models.SessionBlacklist, { foreignKey: 'sessionId' });
    }

    return Session;
};