const express = require('express')
const session = require('express-session')
const PgSession = require('connect-pg-simple')(session)
const path = require('path')
const http = require('http')
const bodyParser = require('body-parser')
const passport = require('passport')

const secrets = require('../config/secrets')
const passportConf = require('../config/passport')

// Create the Express server
const app = express()

// Configure the Express server
app.engine('html', require('ejs').renderFile)
app.set('port', process.env.PORT || 3000)
app.set('views', path.resolve(__dirname, '../public/views'))
app.set('view engine', 'html')

// Attach middleware to Express server
app.use(express.static(path.join(__dirname, '/public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  store: new PgSession({
    conString: secrets.postgres,
    tableName: secrets.sessionTable
  }),
  secret: secrets.sessionSecret,
  saveUninitialized: true,
  resave: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: true // only when on HTTPS
  }
}))
app.use(passport.initialize())
app.use(passport.session())

// Test route
app.get('/', (req, res) => {
  res.render('index')
})

// Define API routes
// ...

// Catch any 403 errors and render the 403 page.
app.use((err, req, res, next) => {
  if (err.status === 403) {
    res.render('403')
  } else {
    next()
  }
})

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
