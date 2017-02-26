var bcrypt = require('bcrypt-nodejs')

module.exports = {
  up: function (queryInterface, Sequelize) {
    return new Promise(function (resolve, reject) {
      queryInterface.bulkInsert('University', [{
        name: 'University of Tyler',
        description: 'The best university in the world!',
        createdAt: 'NOW()',
        updatedAt: 'NOW()'
      }], { returning: true }).then(function (uni) {
        uni = uni[0]
        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            reject(err)
          }

          bcrypt.hash('password', salt, null, (hashErr, hash) => {
            if (hashErr) {
              reject(hashErr)
            }
            return queryInterface.bulkInsert('Users', [{
              email: 'sadmin@test.com',
              password: hash,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              email: 'admin@test.com',
              password: hash,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              email: 'student@test.com',
              password: hash,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }], { returning: true }).then(function (user) {
              return queryInterface.bulkInsert('Membership', [{
                userId: user[0].id,
                rsoId: null,
                universityId: uni.id,
                permissionLevel: 1,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                userId: user[1].id,
                rsoId: null,
                universityId: uni.id,
                permissionLevel: 2,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                userId: user[2].id,
                rsoId: null,
                universityId: uni.id,
                permissionLevel: 3,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }], {}).then(function () {
                return resolve()
              })
            })
          })
        })
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    return [
      queryInterface.bulkDelete('University', [{
        name: 'University of Tyler'
      }]),
      queryInterface.bulkDelete('User', [{
        email: 'sadmin@test.com'
      }]),
      queryInterface.bulkDelete('Membership', [{
        uniId: null
      }]),
      queryInterface.bulkDelete('User', [{
        email: 'admin@test.com'
      }]),
      queryInterface.bulkDelete('Membership', [{
        uniId: null
      }]),
      queryInterface.bulkDelete('User', [{
        email: 'student@test.com'
      }]),
      queryInterface.bulkDelete('Membership', [{
        uniId: null
      }])
    ]
  }
}
