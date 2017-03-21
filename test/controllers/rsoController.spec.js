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

describe ('Rso Controller', () => {
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

  describe ('rsoController#index', () => {

    it ('successfully queries all RSOs', (done) => {
      let params = {
        universityId: testUni.id
      }
      let expect = {
        status: 200,
        filter: _.filter(testRsos, (rso) => {
          return rso.universityId == params.universityId
        })
      }

      passportStub.login(testSadmin)
      testIndex(params, expect, done)
    })

    it ('fails to query RSOs if user not logged in', (done) => {
      let params = {
        universityId: testUni.id
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testIndex(params, expect, done)
    })
  })

  describe ('rsoController#show', () => {
    it ('successfully queries for an RSO id', (done) => {
      let params = {
        universityId: testUni.id,
        rsoId: testRsos[0].id
      }
      let expect = {
        status: 200,
        filter: testRsos[0]
      }

      passportStub.login(testSadmin)
      testShow(params, expect, done)
    })

    it ('fails to query RSO if user not logged in', (done) => {
      let params = {
        universityId: testUni.id,
        rsoId: testRsos[0].id
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testShow(params, expect, done)
    })
  })

  describe ('rsoController#create', () => {
    let users = []

    before ((done) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          reject(err)
        }

        bcrypt.hash('password', salt, null, (hashErr, hash) => {
          if (hashErr) {
            reject(hashErr)
          }

          let promises = _.concat([],
            db.User.create({
              email: 'test1@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null
            }),
            db.User.create({
              email: 'test2@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null
            }),
            db.User.create({
              email: 'test3@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null
            }),
            db.User.create({
              email: 'test4@test.com',
              password: hash,
              inactiveAt: null,
              inactiveById: null
            })
          )

          Promise.all(promises)
            .then((results) => {
              users = results
              done()
            })
        })
      })
    })

    it ('successfully creates a new RSO', (done) => {
      let params = {
        universityId: parseInt(testUni.id),
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        memberEmails: _.map(users, 'email')
      }
      let expect = {
        status: 200,
        filter: _.merge(_.cloneDeep(params), {
          createdById: testSadmin.id
        })
      }
      delete expect.filter.memberEmails

      passportStub.login(testSadmin)
      testCreate(params, expect, done)
    })

    it ('fails to create RSO if not enough users', (done) => {
      let params = {
        universityId: testUni.id,
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        // Remove one element
        memberEmails: _.map(users, 'email')
      }
      params.memberEmails.shift()
      let expect = {
        error: new ApiErrors.NotEnoughMembersInRso()
      }

      passportStub.login(testSadmin)
      testCreate(params, expect, done)
    })

    it ('fails to create RSO if using the logged in user twice', (done) => {
      let params = {
        universityId: testUni.id,
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        // Remove one element
        memberEmails: _.map(users, 'email')
      }
      params.memberEmails[0] = testSadmin.email
      let expect = {
        error: new ApiErrors.NotEnoughMembersInRso()
      }

      passportStub.login(testSadmin)
      testCreate(params, expect, done)
    })

    it ('fails to create RSO if any user twice', (done) => {
      let params = {
        universityId: testUni.id,
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        // Remove one element
        memberEmails: _.map(users, 'email')
      }
      params.memberEmails[0] = params.memberEmails[1]
      let expect = {
        error: new ApiErrors.NotEnoughMembersInRso()
      }

      passportStub.login(testSadmin)
      testCreate(params, expect, done)
    })

    it ('fails to create RSO if a fake user is used', (done) => {
      let params = {
        universityId: testUni.id,
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        // Remove one element
        memberEmails: _.map(users, 'email')
      }
      params.memberEmails[0] = 'fake@new.com'
      let expect = {
        error: new ApiErrors.InvalidUserSpecifiedForCreation()
      }

      passportStub.login(testSadmin)
      testCreate(params, expect, done)
    })

    it ('fails to create RSO if user not logged in', (done) => {
      let params = {
        universityId: testUni.id,
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        memberEmails: _.map(users, 'email')
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testCreate(params, expect, done)
    })

    it ('fails to create RSO user has inadequate permissions as admin', (done) => {
      let params = {
        universityId: testUni.id,
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        memberEmails: _.map(users, 'email')
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      passportStub.login(testAdmin)
      testCreate(params, expect, done)
    })

    it ('fails to create RSO user has inadequate permissions as student', (done) => {
      let params = {
        universityId: testUni.id,
        name: 'My RSO',
        description: 'This is the best RSO ever!',
        memberEmails: _.map(users, 'email')
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      passportStub.login(testStudent)
      testCreate(params, expect, done)
    })

    after ((done) => {
      let promiseArray = []

      _.each(users, (user) => {
        promiseArray = _.concat(promiseArray, user.destroy())
      })

      Promise.all(promiseArray)
        .then(() => {
          done()
        })
    })
  })

  describe ('rsoController#update', () => {
    let updateRso = null

    beforeEach((done) => {
      passportStub.login(testSadmin)
      db.Rso.create({
        createdById: testSadmin.id,
        name: 'TestRso',
        description: 'My description',
        universityId: testUni.id,
        createdAt: null,
        updatedAt: null
      }).then((rso) => {
        updateRso = rso
        testSadmin.addRso(updateRso, {
          permissionLevel: permLevels.ADMIN,
          universityId: testUni.id
        }).then(() => {
          passportStub.logout()
          done()
        }).catch((response) => { console.log('tyler', response, permLevels)})
      })
    })

    it ('successfully updates an RSO when logged in as an admin', (done) => {
      let payload = {
        rsoId: updateRso.id,
        universityId: testUni.id,
        name: 'My Updated RSO'
      }
      let expect = {
        status: 200,
        filter: {
          id: updateRso.id,
          universityId: testUni.id,
          name: 'My Updated RSO',
          description: updateRso.description,
          createdById: testSadmin.id
        }
      }

      // the testSadmin user has an ADMIN role in the test rso
      passportStub.login(testSadmin)
      testUpdate(payload, expect, done)
    })

    it ('fails to update an RSO when not logged in', (done) => {
      let payload = {
        rsoId: updateRso.id,
        universityId: testUni.id,
        name: 'My Updated RSO'
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testUpdate(payload, expect, done)
    })

    it ('fails to update an RSO when not an admin in the RSO', (done) => {
      let payload = {
        rsoId: updateRso.id,
        universityId: testUni.id,
        name: 'My Updated RSO'
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      passportStub.login(testStudent)
      testUpdate(payload, expect, done)
    })

    afterEach((done) => {
      updateRso.destroy().then(() => { done() })
    })
  })

  describe ('rsoController#destroy', () => {
    let destroyRso = null
    let destroyMemb = null

    beforeEach((done) => {
      passportStub.login(testSadmin)
      db.Rso.create({
        createdById: testSadmin.id,
        name: 'TestRso',
        description: 'My description',
        universityId: testUni.id,
        createdAt: null,
        updatedAt: null
      }).then((rso) => {
        destroyRso = rso
        testSadmin.addRso(destroyRso, {
          permissionLevel: permLevels.ADMIN,
          universityId: testUni.id
        }).then(() => {
          passportStub.logout()
          done()
        }).catch((response) => { console.log('tyler', response, permLevels)})
      })
    })

    it ('it successfully marks a record as deleted', (done) => {
      let payload = {
        rsoId: destroyRso.id,
        universityId: testUni.id,
        name: 'My Updated RSO'
      }
      let expect = {
        status: 200,
        filter: {
          id: destroyRso.id,
          universityId: testUni.id,
          name: destroyRso.name,
          description: destroyRso.description,
          createdById: testSadmin.id,
          inactiveById: testSadmin.id
        }
      }

      passportStub.login(testSadmin)
      testDestroy(payload, expect, done)
    })

    it ('it fails to mark a record as deleted when not logged in', (done) => {
      let payload = {
        rsoId: destroyRso.id,
        universityId: testUni.id,
        name: 'My Updated RSO'
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testDestroy(payload, expect, done)
    })

    it ('it fails to mark a record as deleted with no membership in RSO', (done) => {
      let payload = {
        rsoId: destroyRso.id,
        universityId: testUni.id,
        name: 'My Updated RSO'
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      passportStub.login(testStudent)
      testDestroy(payload, expect, done)
    })

    it ('it fails to mark a record as deleted when just a student in the RSO', (done) => {
      let payload = {
        rsoId: destroyRso.id,
        universityId: testUni.id,
        name: 'My Updated RSO'
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      testStudent.addRso(destroyRso, {
        permissionLevel: permLevels.STUDENT,
        universityId: testUni.id
      }).then((memb) => {
        destroyMemb = memb[0][0]
        passportStub.login(testStudent)
        testDestroy(payload, expect, done)
      })

    })

    afterEach((done) => {
      let promises = _.concat([],
        destroyRso.destroy()
      )

      if (destroyMemb) {
        promises = _.concat(promises, destroyMemb.destroy())
      }

      Promise.all(promises)
        .then(() => {
          done()
        })
    })
  })






  let testIndex = (params, expected, done) => {
    let payload = params

    let url = `/api/university/${payload.universityId}/rso`
    chai.request(app)
      .get(url)
      .send(payload)
      .end((err, res) => {

        if (expected.filter) {
          expect(res).to.have.status(expected.status)
          _.each(expected.filter, (rso, index) => {
            _.each(rso, (value, key) => {
              if (_.includes(['createdAt', 'updatedAt', 'inactiveAt'], key)) {
                expect(new Date(res.body[index][key])).to.be.equalDate(value[key])
              } else {
                expect(res.body[index][key]).to.be.eql(value[key])
              }
            })
          })
        } else {
          expect(res).to.have.status(expected.error.status)
          expect(res.body.errorCode).to.be.eql(expected.error.code)
        }

        passportStub.logout()
        done()
      })
  }

  let testShow = (params, expected, done) => {
    let payload = params

    let url = `/api/university/${payload.universityId}/rso/${payload.rsoId}`
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

  let testCreate = (params, expected, done) => {
    let payload = params

    let url = `/api/university/${payload.universityId}/rso`
    chai.request(app)
      .post(url)
      .send(payload)
      .end((err, res) => {
        passportStub.logout()
        if (expected.filter) {
          expect(res).to.have.status(expected.status)
          _.each(expected.filter, (value, key) => {
            expect(res.body[key]).to.be.eql(value)
          })

          let rso = db.Rso.build(res.body)
          rso.destroy()
            .then((response) => {
              done()
            })
        } else {
          expect(res).to.have.status(expected.error.status)
          expect(res.body.errorCode).to.be.eql(expected.error.code)
          done()
        }
      })
  }

  let testUpdate = (params, expected, done) => {
    let payload = params

    let url = `/api/university/${payload.universityId}/rso/${payload.rsoId}`
    chai.request(app)
      .put(url)
      .send(payload)
      .end((err, res) => {
        if (expected.filter) {
          expect(res).to.have.status(expected.status)
          _.each(expected.filter, (value, key) => {
            expect(res.body[key]).to.be.eql(value)
          })

          let rso = db.Rso.build(res.body)
          rso.destroy()
            .then(() => {
              passportStub.logout()
              done()
            })
        } else {
          expect(res).to.have.status(expected.error.status)
          expect(res.body.errorCode).to.be.eql(expected.error.code)
          passportStub.logout()
          done()
        }
      })
  }

  let testDestroy = (params, expected, done) => {
    let payload = params

    let url = `/api/university/${payload.universityId}/rso/${payload.rsoId}`
    chai.request(app)
      .delete(url)
      .send(payload)
      .end((err, res) => {
        if (expected.filter) {
          expect(res).to.have.status(expected.status)
          _.each(expected.filter, (value, key) => {
            expect(res.body[key]).to.be.eql(value)
          })
          expect(res.body.inactiveAt).to.not.be.null

          let rso = db.Rso.build(res.body)
          rso.destroy()
            .then(() => {
              passportStub.logout()
              done()
            })
        } else {
          expect(res).to.have.status(expected.error.status)
          expect(res.body.errorCode).to.be.eql(expected.error.code)
          passportStub.logout()
          done()
        }
      })
  }
})
