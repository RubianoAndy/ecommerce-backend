'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Profile = sequelize.define('Profile', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Cambiado a Sequelize.literal
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Cambiado a Sequelize.literal
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users', // Referencia a la tabla 'users'
                key: 'id',
            },
        },
        name_1: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        name_2: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        lastname_1: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        lastname_2: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        identificationNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        prefix: {
            type: DataTypes.STRING(4),
            allowNull: true,
        },
        mobile: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
    }, {
        tableName: 'profiles', // Nombre de la tabla en la base de datos
        timestamps: true, // Para que Sequelize maneje createdAt y updatedAt automáticamente
    });

    Profile.associate = (models) => {
        Profile.belongsTo(models.User, { foreignKey: 'userId' }); // Relación con el modelo User
    };

    return Profile;
};