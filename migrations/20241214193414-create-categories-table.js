'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW   // Establece la fecha actual por defecto
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW   // Establece la fecha actual por defecto
      },
      deletedAt : {
        type: Sequelize.DATE,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      observations: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: false
      },
    });

    await queryInterface.addIndex('categories', ['name']);
    await queryInterface.addIndex('categories', ['url']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
  }
};
