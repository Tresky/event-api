let mocha = require('mocha')
let chai = require('chai')
let chaiHttp = require('chai-http')
let chaiDate = require('chai-datetime')
let _ = require('lodash')
let moment = require('moment')
var bcrypt = require('bcrypt-nodejs')

let passportStub = require('passport-stub')

let app = require('../../src/app.js')
let Sequelize = require('sequelize')
let db = require('../../src/db.js')
let ApiErrors = require('../../src/lib/apiErrors')
import permLevels from '../../src/lib/permissionLevels'
let config = require('../../config/secrets')

passportStub.install(app)

let should = chai.should
let expect = chai.expect
chai.use(chaiHttp)
chai.use(chaiDate)

describe ('User Controller', () => {
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
      }).catch((res) => {
        console.log(res)
      })
  })

  describe ('userController#show', () => {
    it ('successfully retrieves a user by id', (done) => {
      let params = {
        id: testSadmin.id
      }
      let expect = {
        status: 200,
        filter: testSadmin
      }

      passportStub.login(testSadmin)
      testShow(params, expect, done)
    })

    it ('fails to retrieve a user when not logged in', (done) => {
      let params = {
        id: testSadmin.id
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testShow(params, expect, done)
    })

    it ('fails to retrieve a user that does not exist', (done) => {
      let params = {
        id: 0
      }
      let expect = {
        error: new ApiErrors.UserRecordNotFound()
      }

      passportStub.login(testSadmin)
      testShow(params, expect, done)
    })
  })

  describe ('usersController#update', () => {
    it ('successfully updates fields of a user', (done) => {
      let revert = {
        email: testSadmin.email
      }
      let payload = {
        id: testSadmin.id,
        email: 'newemail@test.com'
      }
      let expect = {
        status: 200,
        filter: {
          id: testSadmin.id,
          email: payload.email
        }
      }

      passportStub.login(testSadmin)
      testUpdate(payload, expect, revert, done)
    })

    it ('fails to update fields of a user when not logged in', (done) => {
      let revert = {
        email: testSadmin.email
      }
      let payload = {
        id: testSadmin.id,
        email: 'newemail@test.com'
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testUpdate(payload, expect, revert, done)
    })

    it ('fails to update fields of a different user', (done) => {
      let revert = {
        email: ''
      }
      let payload = {
        id: testAdmin.id,
        email: 'newemail@test.com'
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      passportStub.login(testSadmin)
      testUpdate(payload, expect, revert, done)
    })
  })
})

let testShow = (params, expected, done) => {
  let payload = params

  let url = `/api/users/${payload.id}`
  chai.request(app)
    .get(url)
    .send(payload)
    .end((err, res) => {

      if (expected.filter) {
        expect(res).to.have.status(expected.status)
        _.each(expected.filter, (value, key) => {
          if (_.includes(['createdAt', 'updatedAt', 'inactiveAt'], key)) {
            expect(new Date(res.body[key])).to.be.equalDate(value[key])
          } else {
            expect(res.body[key]).to.be.eql(value[key])
          }
        })
      } else {
        expect(res).to.have.status(expected.error.status)
        expect(res.body.errorCode).to.be.eql(expected.error.code)
      }

      passportStub.logout()
      done()
    })
}

let testUpdate = (params, expected, revert, done) => {
  let payload = params

  let url = `/api/users/${payload.id}`
  chai.request(app)
    .put(url)
    .send(payload)
    .end((err, res) => {
      if (expected.filter) {
        expect(res).to.have.status(expected.status)

        db.User.findById(res.body.id)
          .then((user) => {
            _.each(expected.filter, (value, key) => {
              expect(res.body[key]).to.be.eql(value)
              user[key] = revert[key]
            })
            user.save()
              .then(() => {
                passportStub.logout()
                done()
              })
          })
      } else {
        expect(res).to.have.status(expected.error.status)
        expect(res.body.errorCode).to.be.eql(expected.error.code)
        passportStub.logout()
        done()
      }
    })
}
