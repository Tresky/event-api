let mocha = require('mocha')
let chai = require('chai')
let chaiHttp = require('chai-http')
let _ = require('lodash')

let passportStub = require('passport-stub')

let app = require('../../src/app.js')
let Sequelize = require('sequelize')
let db = require('../../src/db.js')
let ApiError = require('../../src/lib/apiErrors')
import permLevels from '../../src/lib/permissionLevels'

passportStub.install(app)

let should = chai.should
let expect = chai.expect
chai.use(chaiHttp)

describe ('University Controller', () => {
  let testUni = null
  let testSadmin = null
  let testAdmin = null
  let testStudent = null
  let testRsos = null

  before ((done) => {
    let promises = _.concat([],
      db.University.findOne({ where: { name: 'University of Tyler' } }),
      db.User.findOne({ where: { email: 'sadmin@test.com' } }),
      db.User.findOne({ where: { email: 'admin@test.com' } }),
      db.User.findOne({ where: { email: 'student@test.com' } }),
      db.Rso.findAll({ where: { inactiveAt: null } })
    )

    Promise.all(promises)
      .then((results) => {
        testUni = results[0]
        testSadmin = results[1]
        testAdmin = results[2]
        testStudent = results[3]
        testRsos = results[4]
        done()
      })
  })

  describe ('universityController#index', () => {
    it ('retrieves all universities with a name', (done) => {
      let payload = {
        name: 'University of Tyler'
      }

      passportStub.login(testSadmin)
      chai.request(app)
        .get('/api/university')
        .send(payload)
        .end((err, res) => {
          passportStub.logout()
          expect(res).to.have.status(200)
          expect(_.map(res.body, 'id')).to.be.eql([testUni.id])
          done()
        })
    })

    it ('retrieves all universities with no params', (done) => {
      let payload = {}

      passportStub.login(testSadmin)
      chai.request(app)
        .get('/api/university')
        .send(payload)
        .end((err, res) => {
          passportStub.logout()
          expect(res).to.have.status(200)
          expect(_.map(res.body, 'id')).to.be.eql([testUni.id])
          done()
        })
    })

    it ('fails to retrieve universities when not logged in', (done) => {
      let payload = {}
      let expected = {
        error: new ApiError.UserNotAuthenticated()
      }

      chai.request(app)
        .get('/api/university')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(expected.error.status)
          expect(res.body.errorCode).to.be.eql(expected.error.code)
          done()
        })
    })
  })

  describe ('universityController#show', () => {
    it ('retrieves University record by id', (done) => {
      let payload = {
        id: testUni.id
      }

      passportStub.login(testSadmin)
      chai.request(app)
        .get(`/api/university/${payload.id}`)
        .send(payload)
        .end((err, res) => {
          passportStub.logout()
          expect(res).to.have.status(200)
          expect(res.body.id).to.be.eql(testUni.id)
          done()
        })
    })

    it ('fails to retrieve university when not logged in', (done) => {
      let payload = {
        id: testUni.id
      }
      let expected = {
        error: new ApiError.UserNotAuthenticated()
      }

      // passportStub.login(testSadmin)
      chai.request(app)
        .get(`/api/university/${payload.id}`)
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(expected.error.status)
          expect(res.body.errorCode).to.be.eql(expected.error.code)
          done()
        })
    })
  })

  describe ('universityController#update', () => {
    // TODO: Write tests for the #update function
    // when we write the actual function.
  })

  describe ('universityController#destroy', () => {

    it ('successfully marks a University as deleted', (done) => {
      let payload = {
        id: testUni.id
      }

      passportStub.login(testSadmin)
      chai.request(app)
        .delete(`/api/university/${payload.id}`)
        .send(payload)
        .end((err, res) => {
          passportStub.logout()
          expect(res).to.have.status(200)
          expect(res.body.id).to.be.eql(payload.id)
          expect(res.body.inactiveAt).to.not.be.eql(null)
          expect(res.body.inactiveById).to.not.be.eql(null)
          done()
        })
    })

    afterEach ((done) => {
      testUni.setDataValue('inactiveAt', null)
      testUni.setDataValue('inactiveById', null)

      testUni.save()
        .then(() => {
          done()
        })
    })
  })
})
