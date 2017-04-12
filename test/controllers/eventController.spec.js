let mocha = require('mocha')
let chai = require('chai')
let chaiHttp = require('chai-http')
let chaiDate = require('chai-datetime')
let _ = require('lodash')
let moment = require('moment')

let passportStub = require('passport-stub')

let app = require('../../src/app.js')
let Sequelize = require('sequelize')
let db = require('../../src/db.js')
let ApiErrors = require('../../src/lib/apiErrors')
import permLevels from '../../src/lib/permissionLevels'
import eventPrivacyLevels from '../../src/lib/eventPrivacyLevels'
let config = require('../../config/secrets')

passportStub.install(app)

let should = chai.should
let expect = chai.expect
chai.use(chaiHttp)
chai.use(chaiDate)

describe ('Event Controller', () => {
  let testUni = null
  let testSadmin = null
  let testAdmin = null
  let testStudent = null
  let testRsos = null
  let testEvents = null

  before ((done) => {
    let promises = _.concat([],
      db.University.findOne({ where: { name: 'University of Tyler' } }),
      db.User.findOne({ where: { email: 'sadmin@test.com' } }),
      db.User.findOne({ where: { email: 'admin@test.com' } }),
      db.User.findOne({ where: { email: 'student@test.com' } }),
      db.Rso.findAll({ where: { inactiveAt: null } }),
      db.Event.findAll({ where: { inactiveAt: null } })
    )

    Promise.all(promises)
      .then((results) => {
        testUni = results[0]
        testSadmin = results[1]
        testAdmin = results[2]
        testStudent = results[3]
        testRsos = results[4]
        testEvents = results[5]

        console.log('printing test events', testEvents)
        done()
      })
  }) // #before()

  describe ('eventController#index', () => {

    it ('successfully queries all events', (done) => {
      let params = {
        universityId: testUni.id,

      }
      let expect = {
        status: 200,
        filter: _.filter(testEvents, (event) => {
          return event.universityId == params.universityId
        })
      }

      passportStub.login(testSadmin)
      testIndex(params, expect, done)
    })

    it ('fails to query events if user not logged in', (done) => {
      let params = {
        universityId: testUni.id,
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testIndex(params, expect, done)
    })
  })

  describe ('eventController#show', () => {
    it ('successfully queries for an event id', (done) => {
      let params = {
        universityId: testUni.id,
        rsoId: testRsos[0].id,
        eventId: testEvents[0].id
      }
      let expect = {
        status: 200,
        filter: testEvents[0]
      }

      passportStub.login(testStudent)
      testShow(params, expect, done)
    })

    it ('fails to query event if user not logged in', (done) => {
      let params = {
        universityId: testUni.id,
        rsoId: testRsos[0].id,
        eventId: testEvents[0].id
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testShow(params, expect, done)
    })
  })

  describe ('eventController#create', () => {
    let createdEvent = null

    it ('successfully creates a new event', (done) => {
      let payload = {
        name: 'Open Mic Night',
        description: 'Come join us for a fun time!',
        startTime: moment().add(7, 'days').utc(),
        endTime: moment().add(8, 'days').utc(),
        privacy: eventPrivacyLevels.PUBLIC,
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRsos[0].id
      }

      passportStub.login(testAdmin)

      chai.request(app)
        .post('/api/event')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body.name).to.be.eql(payload.name)

          createdEvent = res.body

          done()
        })
    })

    it ('fails to create a new event when not logged in', (done) => {
      let payload = {
        name: 'Open Mic Night',
        description: 'Come join us for a fun time!',
        startTime: moment().add(7, 'days').utc(),
        endTime: moment().add(8, 'days').utc(),
        privacy: eventPrivacyLevels.PUBLIC,
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRsos[0].id
      }

      chai.request(app)
        .post('/api/event')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(403)
          expect(res.body.errorCode).to.be.eql(102)
          done()
        })
    })

    it ('fails to create a new event when only a student', (done) => {
      let payload = {
        name: 'Open Mic Night',
        description: 'Come join us for a fun time!',
        startTime: moment().add(7, 'days').utc(),
        endTime: moment().add(8, 'days').utc(),
        privacy: eventPrivacyLevels.PUBLIC,
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRsos[1].id
      }

      passportStub.login(testStudent)

      chai.request(app)
        .post('/api/event')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(403)
          expect(res.body.errorCode).to.be.eql(103)
          done()
        })
    })

    it ('fails to create a new event when not in rso', (done) => {
      let payload = {
        name: 'Open Mic Night',
        description: 'Come join us for a fun time!',
        startTime: moment().add(7, 'days').utc(),
        endTime: moment().add(8, 'days').utc(),
        privacy: eventPrivacyLevels.PUBLIC,
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRsos[1].id
      }

      passportStub.login(testSadmin)

      chai.request(app)
        .post('/api/event')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(403)
          expect(res.body.errorCode).to.be.eql(602)
          done()
        })
    })

    afterEach((done) => {
      let promises = _.concat([])

      if (createdEvent) {
        promises = _.concat(promises,
          db.Event.destroy({ where: { id: createdEvent.id } })
        )
      }

      Promise.all(promises)
        .then(() => {
          createdEvent = null
          passportStub.logout()
          done()
        })
    })

  })

  describe ('eventController#update', () => {
   // let updateEvent = testEvents[0]
    //let noUpdateEvent = testEvents[1]

    it ('successfully updates an event when logged in as an admin', (done) => {
      let payload = {
        eventId: testEvents[0].id,
        universityId: testUni.id,
        rsoId: testRsos[0].id,
        name: 'My Updated Event'
      }
      let expect = {
        status: 200,
        filter: {
          eventId: testEvents[0].id,
          universityId: testUni.id,
          rsoId: testRsos[0].id,
          name: 'My Updated Event',
          description: testEvents[0].description,
          createdById: testSadmin.id
        }
      }

      passportStub.login(testSadmin)
      testUpdate(payload, expect, done)
    })

    it ('fails to update an event when not logged in', (done) => {
      let payload = {
        eventId: testEvents[0].id,
        universityId: testUni.id,
        rsoId: testRsos[0].id,
        name: 'My Updated Event'
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testUpdate(payload, expect, done)
    })

    it ('fails to update an event when not an admin in the event', (done) => {
      let payload = {
        eventId: testEvents[1].id,
        universityId: testUni.id,
        rsoId: testRsos[1].id,
        name: 'My Updated Event'
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      passportStub.login(testStudent)
      testUpdate(payload, expect, done)
    })
  })

  describe ('eventController#destroy', () => {
    let destroyEvent = null

    beforeEach ((done) => {
      db.Event.create({
        name: 'Open Mic Night',
        description: 'Come join us for a fun time!',
        startTime: moment().add(7, 'days').utc(),
        endTime: moment().add(8, 'days').utc(),
        privacy: eventPrivacyLevels.PUBLIC,
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRsos[0].id,
        createdById: testSadmin.id
      }).then((evt) => {
        destroyEvent = evt
        done()
      })
    })

    it ('successfully marks event inactive', (done) => {
      let payload = {
        id: destroyEvent.id
      }

      passportStub.login(testUser)

      chai.request(app)
        .delete('/api/university/:universityId/event/:id')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body.id).to.be.eql(payload.id)
          expect(res.body.active).to.be.eql(false)
          done()
        })
    })

    it ('fails to marks event inactive when not authenticated', (done) => {
      let payload = {
        id: destroyEvent.id
      }

      chai.request(app)
        .delete('/api/event/:id')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(403)
          expect(res.body.errorCode).to.be.eql(102)
          done()
        })
    })

    afterEach ((done) => {
      db.Event.destroy({
        where: { id: destroyEvent.id }
      }).then(() => {
        passportStub.logout()
        done()
      })
    })
  })

  let testIndex = (params, expected, done) => {
    let payload = params

    let url = `/api/university/${payload.universityId}/event`
    chai.request(app)
      .get(url)
      .send(payload)
      .end((err, res) => {

        if (expected.filter) {
          expect(res).to.have.status(expected.status)
          console.log('TYLER', res.body)
          _.each(expected.filter, (event, index) => {
            _.each(event, (value, key) => {
              if (_.includes(['createdAt', 'updatedAt', 'inactiveAt'], key)) {
                expect(new Date(res.body.dataValues[index][key])).to.be.equalDate(value[key])
              } else {
                expect(res.body.dataValues[index][key]).to.be.eql(value[key])
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

    let url = `/api/university/${payload.universityId}/event/${payload.eventId}`
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

    let url = `/api/university/${payload.universityId}/event`
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

          let event = db.Event.build(res.body)
          event.destroy()
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

    let url = `/api/university/${payload.universityId}/event/${payload.eventId}`
    chai.request(app)
      .put(url)
      .send(payload)
      .end((err, res) => {
        if (expected.filter) {
          expect(res).to.have.status(expected.status)
          _.each(expected.filter, (value, key) => {
            expect(res.body[key]).to.be.eql(value)
          })

          let event = db.Event.build(res.body)
          event.destroy()
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

    let url = `/api/university/${payload.universityId}/event/${payload.eventId}`
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

          let event = db.Event.build(res.body)
          event.destroy()
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
