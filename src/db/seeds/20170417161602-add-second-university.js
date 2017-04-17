var bcrypt = require('bcrypt-nodejs')

module.exports = {
  up: function (queryInterface, Sequelize) {
    return new Promise(function (resolve, reject) {
      queryInterface.bulkInsert('University', [{
        name: 'University of Kara',
        description: 'Second only to the University of Tyler',
        imageUrl: 'http://www.rice.edu/_images/feature-why-rice.jpg',
        latitude: 28.6024,
        longitude: -81.2001,
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
              email: 'sadmin0@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              firstName: 'Tyler',
              lastName: 'Gauntlett',
              email: 'admin0@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              firstName: 'Kara',
              lastName: 'Singletary',
              email: 'student4@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              firstName: 'Ethan',
              lastName: 'Klein',
              email: 'student5@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              firstName: 'Hugh',
              lastName: 'Mungus',
              email: 'student6@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }, {
              firstName: 'Hila',
              lastName: 'Klein',
              email: 'student7@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null,
              createdAt: 'NOW()',
              updatedAt: 'NOW()'
            }], { returning: true }).then(function (user) {
              return queryInterface.bulkInsert('Rso', [{
                createdById: user[0].id,
                name: 'Engineers for Fun',
                description: 'We like to do engineering.',
                universityId: uni.id,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                createdById: user[0].id,
                name: 'Database Fan Club',
                description: 'We loooove databases.',
                universityId: uni.id,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                createdById: user[0].id,
                name: 'Archery Club',
                description: 'We like bows and arrows.',
                universityId: uni.id,
                createdAt: 'NOW()',
                updatedAt: 'NOW()'
              }, {
                createdById: user[0].id,
                name: 'Farmers: Yeah!',
                description: 'We like to farm.',
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
                  userId: user[3].id,
                  rsoId: null,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[4].id,
                  rsoId: null,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[5].id,
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
                }, {
                  userId: user[3].id,
                  rsoId: rsos[0].id,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[4].id,
                  rsoId: rsos[2].id,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[5].id,
                  rsoId: rsos[3].id,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[3].id,
                  rsoId: rsos[2].id,
                  universityId: uni.id,
                  permissionLevel: 3,
                  inactiveAt: null,
                  createdAt: 'NOW()',
                  updatedAt: 'NOW()'
                }, {
                  userId: user[5].id,
                  rsoId: rsos[1].id,
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
        name: 'University of Kara'
      }]),
      queryInterface.bulkDelete('User', [{
        email: 'sadmin0@test.com'
      }]),
      queryInterface.bulkDelete('Membership', [{
        uniId: null
      }]),
      queryInterface.bulkDelete('User', [{
        email: 'admin0@test.com'
      }]),
      queryInterface.bulkDelete('Membership', [{
        uniId: null
      }]),
      queryInterface.bulkDelete('User', [{
        email: 'student4@test.com'
      }, {
        email: 'student5@test.com'
      }, {
        email: 'student6@test.com'
      }, {
        email: 'student7@test.com'
      }]),
      queryInterface.bulkDelete('Membership', [{
        uniId: null
      }])
    ]
  }
}
