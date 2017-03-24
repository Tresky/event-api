module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Event', {
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
        allowNull: false
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      privacy: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactPhone: Sequelize.STRING,
      contactEmail: Sequelize.STRING,
      rsoId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      universityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      inactiveAt: {
        type: Sequelize.DATE,
        defaultValue: null
      },
      inactiveById: Sequelize.INTEGER,
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
    return queryInterface.dropTable('Event')
  }
}
