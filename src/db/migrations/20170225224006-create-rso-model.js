module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Rso', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      universityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      inactiveAt: {
        type: Sequelize.DATE(6),
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE(6),
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE(6),
        allowNull: false
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Rso')
  }
}
