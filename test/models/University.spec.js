let mocha = require('mocha')
let chai = require('chai')
let chaiHttp = require('chai-http')
let _ = require('lodash')

let app = require('../../src/app.js')
let Sequelize = require('sequelize')
let db = require('../../src/db.js')

let should = chai.should
let expect = chai.expect
chai.use(chaiHttp)

describe ('University Model', () => {
  describe ('#createUniversity', () => {
    let testUser = null
    let existingUni = null
    let testUni0 = null

    beforeEach((done) => {
      let promises = _.concat([],
        db.User.create({
          firstName: 'Tyler',
          lastName: 'Petresky',
          email: 'tnpetresky+0@gmail.com',
          password: 'password',
          universityId: 0
        }).then(function (user) {
          testUser = user

          db.University.create({
            name: 'University of South Florida',
            createdById: testUser.id,
            description: 'My description'
          }).then((uni) => {
            existingUni = uni
          })
        }).catch(function (err) {
          console.log('Failed creating test user', err)
        })
      )

      Promise.all(promises)
        .then(() => {
          done()
        })
    })

    it ('creates a new university', (done) => {
      let params = {
        name: 'University of Central Florida',
        createdById: testUser.id,
        description: 'Best university ever!'
      }

      db.University.createUniversity(params, (err, uni) => {
        expect(err).to.be.eql(null)
        expect(uni.name).to.be.eql(params.name)
        expect(uni.created_by_id).to.be.eql(params.created_by_id)
        expect(uni.description).to.be.eql(params.description)

        testUni0 = uni

        done()
      })
    })

    it ('failed to create a university that already exists', (done) => {
      let params = {
        name: existingUni.name, // This Uni is already created in beforeEach()
        createdById: testUser.id,
        description: 'My description'
      }

      db.University.createUniversity(params, (err, uni) => {
        expect(err).to.not.be.eql(null)
        expect(err.status).to.be.eql(400)
        expect(err.code).to.be.eql(301)
        expect(uni).to.be.eql(null)
        done()
      })
    })

    afterEach((done) => {
      let promises = _.concat([],
        db.User.destroy({ where: { id: testUser.id } }),
        db.University.destroy({ where: { id: existingUni.id } }),
        db.University.destroy({ where: { id: testUni0.id } })
      )

      Promise.all(promises)
        .then(() => {
          done()
        })
    })
  })

})
