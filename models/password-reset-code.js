'use strict';

const { Sequelize } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const PasswordResetCode = sequelize.define('PasswordResetCode', {
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
            type: DataTypes.STRING(6),
            unique: true,
            allowNull: false
        },
        expiresIn: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    }, {
        tableName: 'password_reset_codes', // Nombre de la tabla en la base de datos
        timestamps: true, // Para que Sequelize maneje createdAt y updatedAt automáticamente
    });

    PasswordResetCode.associate = (models) => {
        PasswordResetCode.belongsTo(models.User, { foreignKey: 'userId' });
    }

    return PasswordResetCode;
};