'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('sessions', {
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

    await queryInterface.createTable('sessions_blacklist', {
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
      sessionId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'sessions', // Nombre de la tabla a la que se refiere
          key: 'id', // Clave primaria de la tabla referenciada
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false, // Obligatorio para establecer la relación
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sessions_blacklist');
    await queryInterface.dropTable('sessions');
  }
};
