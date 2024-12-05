'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Country = sequelize.define('Country', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(35),
            unique: true,
            allowNull: false
        },
        prefix: {
            type: DataTypes.STRING(4),
            allowNull: false,
        },
    }, {
        tableName: 'countries',
        timestamps: false,
    });

    Country.associate = (models) => {
        Country.hasMany(models.Department, { foreignKey: 'countryId' });
        Country.hasMany(models.Correspondence, { foreignKey: 'countryId' });
    }

    return Country;
};