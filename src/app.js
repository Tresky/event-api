let express = require('express')
let session = require('express-session')
let PgSession = require('connect-pg-simple')(session)
let path = require('path')
let http = require('http')
let bodyParser = require('body-parser')
let passport = require('passport')
let expressValidator = require('express-validator')

let ApiError = require('./lib/apiErrors')

let secrets = require('../config/secrets')
require('../config/passport')

// Create the Express server
let app = express()

// Configure the Express server
app.engine('html', require('ejs').renderFile)
app.set('port', process.env.PORT || 3000)
app.set('views', path.resolve(__dirname, '../public/views'))
app.set('view engine', 'html')

// Attach middleware to Express server
app.use(express.static(path.join(__dirname, '/public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator())
app.use(session({
  store: new PgSession({
    conString: secrets.postgres,
    tableName: secrets.sessionTable
  }),
  secret: secrets.sessionSecret,
  saveUninitialized: true,
  resave: false
}))
app.use(passport.initialize())
app.use(passport.session())

// Allow for CORS requests to be made to the server. This allows
// requests to come in from any IP address.
app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true)

  // Chrome sends special OPTIONS requests before sending a real
  // HTTP request. If we encounter one of these, intercept it and
  // simply return an okay status.
  if (req.method === 'OPTIONS') {
    res.send(200)
  } else {
    next()
  }
})

/**
 * Custom middleware that will instantiate a custom permissions
 * proxy into the request object should a user be logged in.
 */
import UserPermissionsProxy from './lib/userPermissionsProxy.js'
app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    req.permissions = new UserPermissionsProxy()
    req.permissions.init(req.user)
      .then(() => { next() })
  } else {
    next()
  }
})

// Import controllers
let loginController = require('./controllers/loginController')
let rsoController = require('./controllers/rsoController')
let universityController = require('./controllers/universityController')
let userController = require('./controllers/usersController')

// Define API routes
app.route('/api/auth/login')
  .post(loginController.postLogin)
app.route('/api/auth/signup')
  .post(loginController.postSignup)
app.route('/api/university')
  .get(universityController.index)
app.route('/api/university/:id')
  .get(universityController.show)
  .put(universityController.update)
  .delete(universityController.destroy)
app.route('/api/university/:universityId/rso')
  .get(rsoController.index)
  .post(rsoController.create)
app.route('/api/university/:universityId/rso/:id')
  .get(rsoController.show)
  .put(rsoController.update)
  .delete(rsoController.destroy)
app.route('/api/users/:id')
  .get(userController.show)
  .put(userController.update)

// Handle general API errors
app.use(ApiError.handleError)

// Catch any 404 errors and render the 404 page.
// Note: This must be below all other routes because
// of the way that Express handles routing.
app.use((req, res, next) => {
  res.status(404).render('404')
})

// Start the Express server
http.createServer(app)
  .listen(app.get('port'), () => {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'))
  })

module.exports = app
