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

  })

  describe ('eventController#show', () => {

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
      done()
    })

    it ('fails to create a new event when not in rso', (done) => {
      done()
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
