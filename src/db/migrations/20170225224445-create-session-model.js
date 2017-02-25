module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Session', {
      sid: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      sess: {
        type: Sequelize.JSON,
        allowNull: false
      },
      expire: {
        type: Sequelize.DATE(6),
        allowNull: false
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
    return queryInterface.dropTable('Session')
  }
}
