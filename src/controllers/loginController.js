let passport = require('passport')
let moment = require('moment')
let jwt = require('jwt-simple')

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
      'universityId'
    ], req.body)

    let errors = req.validationErrors()
    if (errors) {
      return next(new ApiError.FailedToSignup(errors))
    }

    // Create the new user
    db.User.createUser(params, (err, user) => {
      if (err) {
        // User#createUser is a custom class function, so
        // the errors that come from it are already ApiErrors.
        return next(err)
      }

      // If the user gets created successfully,
      // go ahead and sign them in.
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return next(new ApiError.FailedToLogin(loginErr))
        }

        // Return the user record
        res.json({ token: generateJwt(user), user: user })
      })
    })
  }
}

module.exports = new LoginController()
