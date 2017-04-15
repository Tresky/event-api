module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('Event', 'latitude', { type: Sequelize.DOUBLE })
    queryInterface.addColumn('Event', 'longitude', { type: Sequelize.DOUBLE })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('Event', 'latitude')
    queryInterface.removeColumn('Event', 'longitude')
  }
}
