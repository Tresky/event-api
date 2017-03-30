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
              firstName: 'Tyler',
              lastName: 'Petresky',
              email: 'sadmin@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              firstName: 'Tyler',
              lastName: 'Gauntlett',
              email: 'admin@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              firstName: 'Kara',
              lastName: 'Singletary',
              email: 'student@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }], { returning: true }).then(function (user) {
              return queryInterface.bulkInsert('Rso', [{
                createdById: user[0].id,
                name: 'TestRso0',
                description: 'My description',
                universityId: uni.id,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                createdById: user[0].id,
                name: 'TestRso1',
                description: 'My description',
                universityId: uni.id,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                createdById: user[0].id,
                name: 'TestRso2',
                description: 'My description',
                universityId: uni.id,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                createdById: user[0].id,
                name: 'TestRso3',
                description: 'My description',
                universityId: uni.id,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }], { returning: true }).then((rsos) => {
                return queryInterface.bulkInsert('Membership', [{
                  userId: user[0].id,
                  rsoId: null,
                  universityId: uni.id,
                  permissionLevel: 1,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[1].id,
                  rsoId: null,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[2].id,
                  rsoId: null,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[0].id,
                  rsoId: rsos[0].id,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[1].id,
                  rsoId: rsos[0].id,
                  universityId: uni.id,
                  permissionLevel: 2,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[2].id,
                  rsoId: rsos[1].id,
                  universityId: uni.id,
                  permissionLevel: 2,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[2].id,
                  rsoId: rsos[2].id,
                  universityId: uni.id,
                  permissionLevel: 2,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[0].id,
                  rsoId: rsos[3].id,
                  universityId: uni.id,
                  permissionLevel: 2,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[1].id,
                  rsoId: rsos[3].id,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }], {}).then(function (response) {
                  return resolve()
                })
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
