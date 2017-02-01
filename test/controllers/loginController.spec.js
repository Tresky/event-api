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

describe ('Login Controller', () => {
  describe ('loginController#postLogin', () => {
    let testUser = null

    beforeEach((done) => {
      let promises = _.concat([],
        db.User.create({
          email: 'tnpetresky+0@gmail.com',
          password: 'password',
          universityId: 1
        }).then(function (user) {
          testUser = user
        }).catch(function (err) {
          console.log('Failed creating test user', err)
        })
      )

      Promise.all(promises).then(() => {
        done()
      })
    })

    it ('allows user to login', (done) => {
      let payload = {
        email: testUser.email,
        password: 'password'
      }

      chai.request(app)
        .post('/api/login')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body.state).to.be.eql(true)
          expect(res.body.user.id).to.be.eql(testUser.id)
          done()
        })
    })

    it ('does not allow user to login with incorrect password', (done) => {
      let payload = {
        email: testUser.email,
        password: 'wrongpassword'
      }

      chai.request(app)
        .post('/api/login')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(401)
          expect(res.body.errorCode).to.be.eql(200)
          done()
        })
    })

    // Drop all of the test objects from the database
    afterEach((done) => {
      let promises = _.concat([],
        db.User.destroy({ where: { id: testUser.id } })
      )

      Promise.all(promises).then(() => {
        done()
      })
    });
  })

  describe ('loginController#postSignup', () => {
    let testUser0 = null
    let testUser1 = null

    beforeEach((done) => {
      let promises = _.concat([],
        db.User.create({
          email: 'tnpetresky+0@gmail.com',
          password: 'password',
          universityId: 1
        }).then(function (user) {
          testUser0 = user
        }).catch(function (err) {
          console.log('Failed creating test user', err)
        })
      )

      Promise.all(promises).then(() => {
        done()
      })
    })

    it ('successfully signs up a new user', (done) => {
      let payload = {
        email: 'tnpetresky+1@gmail.com',
        password: 'password',
        universityId: 1
      }

      chai.request(app)
        .post('/api/signup')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(200)
          expect(res.body.state).to.be.eql(true)
          expect(res.body.user.email).to.be.eql(payload.email)
          expect(res.body.user.universityId).to.be.eql(payload.universityId)

          testUser1 = res.body.user

          done()
        })
    })

    it ('prohibits users from duplicating emails', (done) => {
      let payload = {
        email: 'tnpetresky+0@gmail.com',
        password: 'password',
        universityId: 1
      }

      chai.request(app)
        .post('/api/signup')
        .send(payload)
        .end((err, res) => {
          expect(res).to.have.status(400)
          expect(res.body.errorCode).to.be.eql(202)
          done()
        })
    })

    // Drop all of the test objects from the database
    afterEach((done) => {
      let promises = _.concat([],
        db.User.destroy({ where: { id: testUser0.id } }),
        db.User.destroy({ where: { id: testUser1.id } })
      )

      Promise.all(promises).then(() => {
        done()
      })
    });
  })
})
