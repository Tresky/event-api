module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Subscription', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rsoId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      inactiveAt: {
        type: Sequelize.DATE,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Subscription')
  }
}
