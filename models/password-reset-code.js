'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PasswordResetCode = sequelize.define('PasswordResetCode', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
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
        code: {
            type: DataTypes.STRING(7),
            unique: true,
            allowNull: false
        },
        expiresIn: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    }, {
        tableName: 'password_reset_codes',
        timestamps: true,   // Habilita automáticamente createdAt y updatedAt
    });

    PasswordResetCode.associate = (models) => {
        PasswordResetCode.belongsTo(models.User, { foreignKey: 'userId' });
    }

    return PasswordResetCode;
};