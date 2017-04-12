let express = require('express')
let path = require('path')
let http = require('http')
let bodyParser = require('body-parser')
let expressValidator = require('express-validator')
let moment = require('moment')
let jwt = require('jwt-simple')

let ApiError = require('./lib/apiErrors')

var db = require('./db.js')

let config = require('../config/secrets')

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

  req.isAuthenticated = () => {
    return !!req.user
  }

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
  if (!(req.headers && req.headers.authorization)) {
    return next()
  }

  var header = req.headers.authorization.split(' ')
  var token = header[1]
  var payload = jwt.decode(token, config.jwtSecret, true)
  var now = moment().unix()

  if (now > payload.exp) {
    return next(new ApiError.AuthTokenExpired())
  }

  db.User.findById(payload.sub)
    .then((user) => {
      if (!user) {
        return next(new ApiError.UserRecordNotFound())
      }

      req.user = user
      req.permissions = new UserPermissionsProxy()
      req.permissions.init(req.user)
        .then(() => { next() })
    })
})

// Import controllers
let commentController = require('./controllers/commentController')
let eventController = require('./controllers/eventController')
let loginController = require('./controllers/loginController')
let rsoController = require('./controllers/rsoController')
let subscriptionController = require('./controllers/subscriptionController')
let universityController = require('./controllers/universityController')
let userController = require('./controllers/usersController')

// Define API routes
app.route('/api/auth/login')
  .post(loginController.postLogin)
app.route('/api/auth/signup')
  .post(loginController.postSignup)
app.route('/api/subscription')
  .get(subscriptionController.index)
  .post(subscriptionController.create)
app.route('/api/subscription/:id')
  .delete(subscriptionController.destroy)
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
app.route('/api/university/:universityId/event')
  .get(eventController.index)
  .post(eventController.create)
app.route('/api/university/:universityId/event/:id')
  .get(eventController.show)
  .put(eventController.update)
  .delete(eventController.destroy)
app.route('/api/university/:universityId/event/:eventId/comment')
  .get(commentController.index)
  .post(commentController.create)
app.route('/api/university/:universityId/event/:eventId/comment/:id')
  .get(commentController.show)
  .put(commentController.update)
  .delete(commentController.destroy)
app.route('/api/current_permissions')
  .get(userController.permissions)

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
