module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Membership', {
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
        allowNull: true
      },
      universityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      permissionLevel: {
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
    return queryInterface.dropTable('Membership')
  }
}
