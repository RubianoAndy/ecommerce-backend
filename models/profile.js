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
        dniType: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        dni: {
            type: DataTypes.STRING(30),
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
        tableName: 'profiles',
        timestamps: true,
    });

    Profile.associate = (models) => {
        Profile.belongsTo(models.User, { foreignKey: 'userId' }); // Relación con el modelo User
    };

    return Profile;
};