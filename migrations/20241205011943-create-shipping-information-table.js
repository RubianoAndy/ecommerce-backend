'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('correspondences', {
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
      deletedAt : {
        type: Sequelize.DATE,
        allowNull: true,
      },
      profileId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      countryId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'countries',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      departmentId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      zipCode: {
        type: Sequelize.STRING(8),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      observations: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('correspondences');
  }
};
