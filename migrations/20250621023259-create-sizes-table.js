'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('sizes', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sizes');
  }
};
