'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Department = sequelize.define('Department', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        countryId: {
            type: DataTypes.BIGINT,
            references: {
                model: 'countries', // Nombre de la tabla a la que se refiere
                key: 'id', // Clave primaria de la tabla referenciada
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            allowNull: false, // Obligatorio para establecer la relación
        },
    }, {
        tableName: 'departments',
        timestamps: false,
    });

    Department.associate = (models) => {
        Department.belongsTo(models.Country, { foreignKey: 'countryId' });
        Department.hasMany(models.Correspondence, { foreignKey: 'departmentId' });
    }

    return Department;
};