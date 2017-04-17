module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Comment', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdById: {
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
    return queryInterface.dropTable('Comments')
  }
}
