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
      imageUrl: 'http://demandware.edgesuite.net/aamm_prd/on/demandware.static/-/Sites-joann-product-catalog/default/dwf17e8a54/images/hi-res/94/9434051.jpg',
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
      imageUrl: 'https://sayanything.areavoices.com/files/2014/10/Free-Speech.jpg',
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
      imageUrl: 'http://shootoholic.com/wp-content/uploads/2015/10/target-practice-for-skeet-shooting-shootoholic.jpg',gu
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
      imageUrl: 'http://www.thewellarmedwoman.com/image/data/pages/Cautionweb2.jpg',
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
      imageUrl: 'http://images.gawker.com/ds065ci66nuauqowuafa/original.png',
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
      imageUrl: 'http://clv.h-cdn.co/assets/15/24/640x320/landscape-1433962113-cross-stitch-watermelon-0615.jpg',
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
