const mocha = require('mocha')
const chai = require('chai')
const _ = require('lodash')

var app = require('../../src/app.js')
var Sequelize = require('sequelize')
var db = require('../../src/db.js')

var assert = chai.assert

// Tes the User Model for errors
describe('User model', function () {
  var testUser = null
  var testRso = null
  var testUni = null

  // Before each test, create some test objects
  beforeEach(function (done) {
    let promises = _.concat([],
      db.User.create({
        email: 'tnpetresky+0@gmail.com',
        password: 'password',
        universityId: 0
      }).then(function (user) {
        testUser = user
      }).catch(function (err) {
        console.log('Failed creating test user', err)
      }),
      db.Rso.create({
        created_by_id: 42,
        name: 'TechKnights',
        universityId: 1
      }).then(function (rso) {
        testRso = rso
      }).catch(function (err) {
        console.log('Failed creating test rso', err)
      }),
      db.University.create({
        created_by_id: 42,
        name: 'UCF'
      }).then(function (uni) {
        testUni = uni
      }).catch(function (err) {
        console.log('Failed to created test university', err)
      })
    )

    Promise.all(promises).then(function (asd) {
      done()
    })
  })

  it ('should become associated with an RSO through a Membership', function (done) {
    testUser.addRso(testRso)
      .then(function (data) {
        db.Membership.findAll({
          where: {
            userId: testUser.id,
            rsoId: testRso.id
          }
        }).then(function (membs) {
          assert(membs.length === 1)
          assert(membs[0].get('userId') === testUser.id)
          assert(membs[0].get('rsoId') === testRso.id)
          done()
        }, function (err) {
          done(err)
        })
      }, function (err) {
        done(err)
      })
  })

  // Drop all of the test objects from the database
  afterEach(function (done) {
    let promises = _.concat([],
      db.User.destroy({ where: { id: testUser.id } }),
      db.Rso.destroy({ where: { id: testRso.id } }),
      db.University.destroy({ where: { id: testUni.id } })
    )

    Promise.all(promises).then(function () {
      done()
    })
  });
})
