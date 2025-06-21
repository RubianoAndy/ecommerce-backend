'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('profiles', {
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
      name_1: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      name_2: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      lastname_1: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      lastname_2: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      dniType: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      dni: {
        type: Sequelize.STRING(30),
        allowNull: true
      },
      prefix: {
        type: Sequelize.STRING(4),
        allowNull: true
      },
      mobile: {
        type: Sequelize.STRING(15),
        allowNull: true
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('profiles');
  }
};
