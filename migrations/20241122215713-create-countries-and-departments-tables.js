'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('countries', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(35),
        unique: true,
        allowNull: false
      },
      prefix: {
        type: Sequelize.STRING(4),
        allowNull: false,
      },
    });

    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      countryId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'countries', // Nombre de la tabla a la que se refiere
          key: 'id', // Clave primaria de la tabla referenciada
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false, // Obligatorio para establecer la relación
      },
    });

    await queryInterface.addIndex('departments', ['countryId']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('departments');
    await queryInterface.dropTable('countries');
  }
};
