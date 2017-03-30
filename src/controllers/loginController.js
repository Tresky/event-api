let passport = require('passport')
let moment = require('moment')
let jwt = require('jwt-simple')
let _ = require('lodash')

let db = require('../db')
let config = require('../../config/secrets')
let ApiError = require('../lib/apiErrors')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

import permLevels from '../lib/permissionLevels'

let generateJwt = (user) => {
  let payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  }
  let token = jwt.encode(payload, config.sessionSecret)
  return token
}

class LoginController extends ApiController {
  postLogin (req, res, next) {
    req.assert('email', 'required').notEmpty()
    req.assert('email', 'valid email required').isEmail()
    req.assert('password', 'password cannot be empty').notEmpty()

    let errors = req.validationErrors()
    if (errors) {
      return next(new ApiError.FailedToLogin(errors))
    }

    passport.authenticate('local', (err, user, info) => {
      if (!user || err) {
        return next(new ApiError.FailedToLogin(err))
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return next(new ApiError.FailedToLogin(loginErr))
        }
        res.json({ token: generateJwt(user) })
      })
    })(req, res, next) // <-----
    // HTTP request, like this POST request (postLogin()) are
    // handled in Express middleware. This means that all HTTP
    // requests are intercepted by Express and passed from
    // middleware function to middleware function until it the
    // request finds a function that will handle it. This is
    // essentially allowing the function to pass requests onward
    // in the event that they can't be handled by passport or
    // that they need to continue through after passport has
    // handled them. This is actually a bit complicated, but
    // hopefully this helps a bit. :)
  }

  logout (req, res, next) {
    req.logout()
    res.locals.user = null
  }

  // There are three primary branches of logic involved in creating a user.
  // If you specify a universityId, the function will make sure that a
  // university with that ID exists. If not, an error is raised, if so,
  // the user gets created. If you don't specify a universityId, a new one
  // can be created only if you specify the parameters for it and the user's
  // permission level is SUPERADMIN.
  postSignup (req, res, next) {
    let params = helpers.requireParams([
      'firstName',
      'lastName',
      'email',
      'password',
      'permissionLevel'
    ], req.body)

    params.universityId = null
    if (req.body.universityId) {
      params.universityId = req.body.universityId
    }

    let errors = req.validationErrors()
    if (errors) {
      return next(new ApiError.FailedToSignup(errors))
    }

    let userPayload = _.pick(params, ['email', 'password', 'firstName', 'lastName'])

    // Add the user to an existing University
    if (params.universityId) {
      db.University.count({ where: { id: params.universityId } })
        .then((count) => {
          if (count > 0) {
            return createUser()
          } else {
            return next(new ApiError.UniversityRecordNotFound())
          }
        })
    // If no University exists, we can create a new one, but only
    // if the new user is meant to be a SUPERADMIN.
    } else if (params.permissionLevel === permLevels.SUPERADMIN) {
      // Need to create a university only if the user is meant to
      // be a SUPERADMIN
      let uniParams = helpers.requireParams([
        'universityName'
      ], req.body)

      if (req.body.description) {
        uniParams.description = req.body.description
      }
      uniParams.name = uniParams.universityName
      delete uniParams.universityName

      db.University.createUniversity(uniParams, (err, uni) => {
        if (err) {
          return next(err)
        }

        let revertUni = (response) => {
          db.University.destroy({ where: { id: uni.id } })
            .then(() => {
              return next(response)
            })
        }

        params.universityId = uni.id

        createUser(revertUni)
      })
    // Otherwise, we don't have a University and we can't make a new one.
    } else {
      return next(new ApiError.NoUniversitySpecifiedToJoin(params))
    }

    let createUser = (revertUni) => {
      // Create the new user
      // Typically, we would use a transaction here, but
      // because of how the User#createUser() function is being
      // used, we cannot. So, we have to do manual cleanup.
      db.User.createUser(userPayload, (err, user) => {
        if (err) {
          // User#createUser is a custom class function, so
          // the errors that come from it are already ApiErrors.
          return next(err)
        }

        let revertUser = (response) => {
          db.User.destroy({ where: { id: user.id } })
            .then(() => {
              return next(response)
            })
        }

        // Typically, to add a membership, you should
        // use the built in method, addRso(), but in this
        // case, we are adding a membership with no RSO,
        // so the implementation is custom.
        let membParams = {
          userId: user.id,
          universityId: params.universityId,
          rsoId: null,
          permissionLevel: params.permissionLevel
        }

        // Create a membership for the user to be a part of
        // a university.
        db.Membership.create(membParams)
          .then((memb) => {
            // If the user gets created successfully,
            // go ahead and sign them in.
            req.logIn(user, (loginErr) => {
              if (loginErr) {
                if (revertUni) {
                  revertUni(loginErr)
                }
                revertUser(loginErr)
                return next(new ApiError.FailedToLogin(loginErr))
              }

              // Return the user record
              res.json({ token: generateJwt(user), user: user })
            })
          }, (response) => {
            // Roll back the creation of the User if creating
            // the Membership failed.
            if (revertUni) {
              revertUni(response)
            }
            revertUser(response)
          })
      })
    }
  }
}

module.exports = new LoginController()
