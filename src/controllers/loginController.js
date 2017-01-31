let passport = require('passport')

let db = require('../db')
let ApiError = require('../lib/apiErrors')
let $ = require('../lib/controllerHelpers')

exports.postLogin = (req, res, next) => {
  // req.assert('email', 'Email is not valid').isEmail()
  // req.assert('password', 'Password cannot be blank').notEmpty()

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
      res.json({
        state: req.isAuthenticated(),
        user: user
      })
    })
  })(req, res, next)
}

exports.logout = (req, res) => {
  req.logout()
  res.locals.user = null
}

exports.postSignup = (req, res, next) => {
  let params = $.requireParams([
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
      res.json({
        state: req.isAuthenticated(),
        user: user
      })
    })
  })
}
