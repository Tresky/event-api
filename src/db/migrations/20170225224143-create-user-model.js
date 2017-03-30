module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        isEmail: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      logins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      resetPasswordExpires: Sequelize.DATE,
      resetPasswordToken: Sequelize.STRING,
      inactiveAt: Sequelize.DATE,
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
    queryInterface.dropTable('Users')
  }
}
