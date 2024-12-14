'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        activated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        email: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        roleId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false
        },
    }, {
        tableName: 'users',
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
    });

    User.associate = (models) => {
        User.hasOne(models.Profile, { foreignKey: 'userId' });
        User.hasMany(models.Session, { foreignKey: 'userId' });
        User.hasMany(models.PasswordResetCode, { foreignKey: 'userId' });
        User.hasOne(models.UserActivation, { foreignKey: 'userId' });

        User.belongsTo(models.Role, { foreignKey: 'roleId' });
    };

    return User;
};