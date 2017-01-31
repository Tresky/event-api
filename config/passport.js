const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

var db = require('../src/db.js')

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  db.User.findById(id)
    .then((user) => {
      done(null, user)
    })
    .catch((err) => {
      done(err)
    })
})

passport.use(new LocalStrategy({
  usernameField: 'email'
}, (email, password, done) => {
  email = email.toLowerCase()
  db.User.findUser(email, password, (err, user) => {
    if (err) {
      return done(err, null)
    } else {
      return done(null, user)
    }
  })
}))

exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  } else {
    // TODO
    console.log('Not authenticated')
  }
}

exports.isAuthorized = (req, res, next) => {
  var provider = req.path.split('/').slice(-1)[0]

  if (req.user.tokens[provider]) {
    next()
  } else {
    console.log('Not authorized')
  }
}
