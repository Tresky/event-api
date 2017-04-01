let mocha = require('mocha')
let chai = require('chai')
let chaiHttp = require('chai-http')
let _ = require('lodash')
let moment = require('moment')

let passportStub = require('passport-stub')

let app = require('../../src/app.js')
let Sequelize = require('sequelize')
let db = require('../../src/db.js')

passportStub.install(app)

let should = chai.should
let expect = chai.expect
chai.use(chaiHttp)

describe ('Event Controller', () => {
  let testUni = null
  let testRso = null
  let testUser = null
  let testNotMember = null
  let testNoPermissionUser = null
  let memberships = []

  // Create a User record to use throughout all tests
  // This represents the 'super admin' the can create
  // and manage a University.
  before ((done) => {
    db.University.create({
      name: 'Testing University',
      description: 'My description'
    }).then((uni) => {
      testUni = uni
      db.User.create({
        email: 'eventtest@test.com',
        password: 'password',
        universityId: testUni.id
      }).then((user) => {
        testUser = user
        db.Membership.create({
          userId: testUser.id,
          universityId: testUni.id,
          rsoId: null,
          permissionLevel: 1
        }).then((memb) => {
          memberships = _.concat(memberships, [memb])

          db.Rso.create({
            name: 'Musical People',
            description: 'We like music!',
            universityId: testUni.id,
            createdById: testUser.id
          }).then((rso) => {
            testRso = rso
            db.Membership.create({
              userId: testUser.id,
              universityId: testUni.id,
              rsoId: testRso.id,
              permissionLevel: 2
            }).then((memb) => {
              memberships = _.concat(memberships, [memb])
              done()
            })
          })
        })
      })
    })
  }) // #before()


  describe ('eventController#index', () => {

    it ('successfully queries all events', (done) => {
      let params = {
        universityId: testUni.id,
        rsoId: testRso.id
      }
      let expect = {
        status: 200,
        filter: _.filter(testEvents, (event) => {
          return event.rsoId == params.rsoId
        })
      }

      passportStub.login(testUser)
      testIndex(params, expect, done)
    })

    it ('fails to query events if user not logged in', (done) => {
      let params = {
        universityId: testUni.id,
        rsoId: testRso.id
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
        rsoId: testRso.id,
        eventId: testEvents[0].id
      }
      let expect = {
        status: 200,
        filter: testEvents[0]
      }

      passportStub.login(testUser)
      testShow(params, expect, done)
    })

    it ('fails to query event if user not logged in', (done) => {
      let params = {
        universityId: testUni.id,
        rsoId: testRso.id,
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
        privacy: 'public',
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRso.id
      }

      passportStub.login(testUser)

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

    //should user change so it fails?
    it ('fails to create a new event when not logged in', (done) => {
      let payload = {
        name: 'Open Mic Night',
        description: 'Come join us for a fun time!',
        startTime: moment().add(7, 'days').utc(),
        endTime: moment().add(8, 'days').utc(),
        privacy: 'public',
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRso.id
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
        privacy: 'public',
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRso.id
      }

      passportStub.login(testUser)
      
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
        privacy: 'public',
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRso.id
      }

      passportStub.login(testUser)
      
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
    let updateEvent = null

    beforeEach((done) => {
      passportStub.login(testUser)
      db.Event.create({
        name: 'Open Mic Night',
        description: 'Come join us for a fun time!',
        startTime: moment().add(7, 'days').utc(),
        endTime: moment().add(8, 'days').utc(),
        privacy: 'public',
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRso.id
      }).then((event) => {
        updateEvent = event
        testUser.addEvent(updateEvent, {
          permissionLevel: permLevels.ADMIN,
          universityId: testUni.id,
          rsoId: testRso.id
        }).then(() => {
          passportStub.logout()
          done()
        }).catch((response) => { console.log('check', response, permLevels)})
      })
    })

    it ('successfully updates an event when logged in as an admin', (done) => {
      let payload = {
        eventId: updateEvent.id,
        universityId: testUni.id,
        rsoId: testRso.id,
        name: 'My Updated Event'
      }
      let expect = {
        status: 200,
        filter: {
          eventId: updateEvent.id,
          universityId: testUni.id,
          rsoId: testRso.id,
          name: 'My Updated Event'
          description: updateEvent.description,
          createdById: testUser.id
        }
      }

      passportStub.login(testUser)
      testUpdate(payload, expect, done)
    })

    it ('fails to update an event when not logged in', (done) => {
      let payload = {
        eventId: updateEvent.id,
        universityId: testUni.id,
        rsoId: testRso.id,
        name: 'My Updated Event'
      }
      let expect = {
        error: new ApiErrors.UserNotAuthenticated()
      }

      testUpdate(payload, expect, done)
    })

    it ('fails to update an event when not an admin in the event', (done) => {
      let payload = {
        eventId: updateEvent.id,
        universityId: testUni.id,
        rsoId: testRso.id,
        name: 'My Updated Event'
      }
      let expect = {
        error: new ApiErrors.InvalidPermissionForAction()
      }

      passportStub.login(testUser) //should be testNoPermissionUser?
      testUpdate(payload, expect, done)
    })

    afterEach((done) => {
      updateEvent.destroy().then(() => { done() })
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
        privacy: 'public',
        category: 'Music',
        universityId: testUni.id,
        rsoId: testRso.id,
        createdById: testUser.id
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
        .delete('/api/event/:id')
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


  after((done) => {
    let promises = _.concat([],
      db.University.destroy({ where: { id: testUni.id } }),
      db.Rso.destroy({ where: { id: testRso.id } }),
      db.User.destroy({ where: { id: testUser.id } })
    )

    _.each(memberships, (memb) => {
      promises = _.concat(promises,
        db.Membership.destroy({ where: { id: memb.id } })
      )
    })

    Promise.all(promises)
      .then(() => {
        done()
      })
  })
})
