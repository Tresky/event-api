module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('University', 'imageUrl', { type: Sequelize.STRING })
    queryInterface.addColumn('Event', 'imageUrl', { type: Sequelize.STRING })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('University', 'imageUrl')
    queryInterface.removeColumn('Event', 'imageUrl')
  }
}
