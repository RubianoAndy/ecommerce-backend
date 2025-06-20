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
        userId: {
            type: DataTypes.BIGINT,
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
            type: DataTypes.STRING(50),
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
        avatar: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'profiles',
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
    });

    Profile.associate = (models) => {
        Profile.belongsTo(models.User, { foreignKey: 'userId' }); // Relación con el modelo User
        Profile.hasOne(models.Correspondence, { foreignKey: 'profileId' });
    };

    return Profile;
};