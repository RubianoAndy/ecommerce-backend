'use strict';

const { Sequelize } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Session_Blacklist = sequelize.define('Session_Blacklist', {
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
        tableName: 'sessions_blacklist', // Nombre de la tabla en la base de datos
        timestamps: true, // Para que Sequelize maneje createdAt y updatedAt automáticamente
    });

    Session_Blacklist.associate = (models) => {
        Session_Blacklist.belongsTo(models.Session, { foreignKey: 'sessionId' });
    }

    return Session_Blacklist;
};