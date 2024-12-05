'use strict';

const { Sequelize, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const Correspondence = sequelize.define('Correspondence', {
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
        profileId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'profiles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false
        },
        countryId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'countries',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false
        },
        departmentId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'departments',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false
        },
        city: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        zipCode: {
            type: DataTypes.STRING(8),
            allowNull: false,
            validate: {
                len: [1, 8], // Asegura que el zip tenga entre 1 y 8 caracteres
            }
        },
        address: {
            type: DataTypes.STRING(80),
            allowNull: false
        },
        observations: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
    },
    {
        tableName: 'correspondences',
        timestamps: true,
        paranoid: true, // Habilita soft deletes de forma automática
    });

    Correspondence.associate = (models) => {
        Correspondence.belongsTo(models.Profile, { foreignKey: 'profileId' });
        Correspondence.belongsTo(models.Country, { foreignKey: 'countryId' });
        Correspondence.belongsTo(models.Department, { foreignKey: 'departmentId' });
    };

    return Correspondence;
};