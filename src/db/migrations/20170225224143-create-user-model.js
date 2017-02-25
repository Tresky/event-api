module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
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
    queryInterface.dropTable('Users')
  }
}
