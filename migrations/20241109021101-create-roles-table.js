'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Establece la fecha actual por defecto
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Establece la fecha actual por defecto
      },
      deletedAt : {
        type: Sequelize.DATE,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false
      },
    });

    await queryInterface.addColumn('users', 'roleId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'roleId');
    await queryInterface.dropTable('roles');
  }
};
