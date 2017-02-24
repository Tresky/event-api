let mocha = require('mocha')
let chai = require('chai')
let chaiHttp = require('chai-http')
let _ = require('lodash')

let passportStub = require('passport-stub')

let app = require('../../src/app.js')
let Sequelize = require('sequelize')
let db = require('../../src/db.js')

passportStub.install(app)

let should = chai.should
let expect = chai.expect
chai.use(chaiHttp)

describe ('University Controller', () => {
  let testUser = null

  // Create a User record to use throughout all tests
  // This represents the 'super admin' the can create
  // and manage a University.
  before ((done) => {
    let promises = _.concat([],
      db.User.create({
        email: 'tnpetresky+0@gmail.com',
        password: 'password',
        universityId: 0
      }).then((user) => {
        testUser = user
        passportStub.login(testUser)
      }).catch((err) => {
        console.log('Failed creating test user', err)
      })
    )

    Promise.all(promises)
      .then(() => {
        done()
      })
  })

  describe ('universityController#index', () => {
    // TODO: Will write these tests if we decide to use the
    // #index method in the future.
  })

  describe ('universityController#show', () => {
    let existingUni = null

    beforeEach((done) => {
      let promises = _.concat([],
        db.University.create({
          name: 'University of South Florida',
          created_by_id: testUser.id,
          description: 'My description'
        }).then((uni) => {
          existingUni = uni
        })
      )

      Promise.all(promises)
        .then(() => {
          done()
        })
    })

    it ('retrieves University record by id', (done) => {
      let payload = {
        id: existingUni.id
      }

      chai.request(app)
        .get('/api/university/:id')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body.id).to.be.eql(existingUni.id)
          done()
        })
    })

    afterEach((done) => {
      let promises = _.concat([],
        db.University.destroy({ where: { id: existingUni.id } })
      )

      Promise.all(promises)
        .then(() => {
          done()
        })
    })
  })

  describe ('universityController#create', () => {
    let testUni = null
    let existingUni = null

    beforeEach ((done) => {
      let promises = _.concat([],
        db.University.create({
          name: 'University of South Florida',
          created_by_id: testUser.id,
          description: 'My description'
        }).then((uni) => {
          existingUni = uni
        })
      )

      Promise.all(promises)
        .then(() => {
          done()
        })
    })

    it ('successfully creates a new University record', (done) => {
      let payload = {
        name: 'University of Central Florida',
        created_by_id: testUser.id,
        description: 'My description'
      }

      chai.request(app)
        .post('/api/university')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body.id).to.not.be.eql(null)
          expect(res.body.name).to.be.eql(payload.name)
          expect(res.body.created_by_id).to.be.eql(payload.created_by_id)
          expect(res.body.description).to.be.eql(payload.description)

          testUni = res.body

          done()
        })
    })

    it ('fails to create a University with a name that is taken', (done) => {
      let payload = {
        name: existingUni.name,
        created_by_id: testUser.id,
        description: 'My new description'
      }

      chai.request(app)
        .post('/api/university')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body.errorCode).to.be.eql(301)

          testUni = res.body

          done()
        })
    })

    // TODO: In the future, we need to find a way to
    // restrict the creation of Universities to very
    // specific situations. Maybe creation-tokens? Not
    // sure, yet.

    // Delete the University record that was created during
    // each test. If no record was created, just skip.
    afterEach((done) => {
      let promises = _.concat([],
        db.University.destroy({ where: { id: existingUni.id } })
      )

      if (testUni) {
        promises = _.concat(promises,
          db.University.destroy({ where: { id: testUni.id } })
        )
      }

      Promise.all(promises)
        .then(() => {
          done()
        })
    })
  })

  describe ('universityController#update', () => {
    // TODO: Write tests for the #update function
    // when we write the actual function.
  })

  describe ('universityController#destroy', () => {
    let existingUni = null

    beforeEach ((done) => {
      let promises = _.concat([],
        db.University.create({
          name: 'University of South Florida',
          created_by_id: testUser.id,
          description: 'My description'
        }).then((uni) => {
          existingUni = uni
        })
      )

      Promise.all(promises)
        .then(() => {
          done()
        })
    })

    it ('successfully marks a University as deleted', (done) => {
      let payload = {
        id: existingUni.id
      }

      chai.request(app)
        .delete('/api/university/:id')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body.id).to.be.eql(payload.id)
          expect(res.body.deleted_at).to.not.be.eql(null)

          done()
        })
    })

    afterEach ((done) => {
      let promises = _.concat([],
        db.University.destroy({ where: { id: existingUni.id } })
      )

      Promise.all(promises)
        .then(() => {
          done()
        })
    })
  })

  // Delete the Super Admin User record that was made
  // at the beginning.
  after ((done) => {
    let promises = _.concat([],
      db.User.destroy({ where: { id: testUser.id } })
    )

    Promise.all(promises)
      .then(() => {
        done()
      })
  })
})
