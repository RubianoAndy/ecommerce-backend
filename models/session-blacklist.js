'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SessionBlacklist = sequelize.define('SessionBlacklist', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        sessionId: {
            type: DataTypes.BIGINT,
            references: {
                model: 'sessions', // Nombre de la tabla a la que se refiere
                key: 'id', // Clave primaria de la tabla referenciada
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false, // Obligatorio para establecer la relación
        },
    }, {
        tableName: 'sessions_blacklist',
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
    });

    SessionBlacklist.associate = (models) => {
        SessionBlacklist.belongsTo(models.Session, { foreignKey: 'sessionId' });
    }

    return SessionBlacklist;
};