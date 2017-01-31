const passport = require('passport')

const ApiError = require('../lib/apiErrors')

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
