let passport = require('passport')
let moment = require('moment')
let jwt = require('jwt-simple')
let _ = require('lodash')

let db = require('../db')
let config = require('../../config/secrets')
let ApiError = require('../lib/apiErrors')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

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

  postSignup (req, res, next) {
    let params = helpers.requireParams([
      'email',
      'password',
      'universityId',
      'permissionLevel'
    ], req.body)

    let errors = req.validationErrors()
    if (errors) {
      return next(new ApiError.FailedToSignup(errors))
    }

    let userPayload = _.pick(params, ['email', 'password'])

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
          console.log('Membership', memb)

          // If the user gets created successfully,
          // go ahead and sign them in.
          req.logIn(user, (loginErr) => {
            if (loginErr) {
              return next(new ApiError.FailedToLogin(loginErr))
            }

            // Return the user record
            res.json({ token: generateJwt(user), user: user })
          })
        }, (response) => {
          // Roll back the creation of the User if creating
          // the Membership failed.
          db.User.destroy({ where: { id: user.id } })
            .then(() => {
              return next(response)
            })
        })
    })
  }
}

module.exports = new LoginController()
