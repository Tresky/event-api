var moment = require('moment')

module.exports = {
  up: function (queryInterface, Sequelize) {
    var rsos = [1, 2, 3, 4]
    return queryInterface.bulkInsert('Event', [{
      createdById: 5,
      name: 'Sowing 101',
      description: 'We will sow!',
      latitude: 28.604010,
      longitude: -81.199116,
      startTime: moment().add(2, 'days').format(),
      endTime: moment().add(2, 'days').format(),
      privacy: 3,
      category: 'Crafts',
      rsoId: rsos[3],
      universityId: 1,
      createdAt: 'NOW()',
      updatedAt: 'NOW()'
    }, {
      createdById: 3,
      name: 'Free Speech Event',
      description: 'Let\'s just talk',
      latitude: 28.604010,
      longitude: -81.199116,
      startTime: moment().add(2, 'days').format(),
      endTime: moment().add(2, 'days').format(),
      privacy: 3,
      category: 'Politics',
      rsoId: rsos[0],
      universityId: 1,
      createdAt: 'NOW()',
      updatedAt: 'NOW()'
    }, {
      createdById: 3,
      name: 'Target Practice',
      description: 'Let\'s shoot some stuff.',
      latitude: 28.604010,
      longitude: -81.199116,
      startTime: moment().add(4, 'days').format(),
      endTime: moment().add(4, 'days').format(),
      privacy: 3,
      category: 'Entertainment',
      rsoId: rsos[2],
      universityId: 1,
      createdAt: 'NOW()',
      updatedAt: 'NOW()'
    }, {
      createdById: 3,
      name: 'Gun Safety',
      description: 'Safety First',
      latitude: 28.604010,
      longitude: -81.199116,
      startTime: moment().add(5, 'days').format(),
      endTime: moment().add(5, 'days').format(),
      privacy: 2,
      category: 'Entertainment',
      rsoId: rsos[2],
      universityId: 1,
      createdAt: 'NOW()',
      updatedAt: 'NOW()'
    }, {
      createdById: 3,
      name: 'Life of Bernie!',
      description: 'We will learn about our lord and savior.',
      latitude: 28.604010,
      longitude: -81.199116,
      startTime: moment().add(1, 'days').format(),
      endTime: moment().add(1, 'days').format(),
      privacy: 3,
      category: 'Politics',
      rsoId: rsos[1],
      universityId: 1,
      createdAt: 'NOW()',
      updatedAt: 'NOW()'
    }, {
      createdById: 3,
      name: 'Cross Stitching for n00bs',
      description: 'Learn about how to cross stitch.',
      latitude: 28.604010,
      longitude: -81.199116,
      startTime: moment().add(4, 'days').format(),
      endTime: moment().add(4, 'days').format(),
      privacy: 2,
      category: 'Politics',
      rsoId: rsos[3],
      universityId: 1,
      createdAt: 'NOW()',
      updatedAt: 'NOW()'
    }])
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Event', null, {})
  }
}
