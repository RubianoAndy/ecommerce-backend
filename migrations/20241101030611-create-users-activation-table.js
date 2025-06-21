'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users_activation', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW // Establece la fecha actual por defecto
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW // Establece la fecha actual por defecto
      },
      userId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false, // Obligatorio
      },
      jti: {
        type: Sequelize.TEXT,
        allowNull: false, // Obligatorio
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users_activation');
  }
};
