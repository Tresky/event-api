module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('University', 'latitude', { type: Sequelize.DOUBLE })
    queryInterface.addColumn('University', 'longitude', { type: Sequelize.DOUBLE })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('University', 'latitude')
    queryInterface.removeColumn('University', 'longitude')
  }
}
