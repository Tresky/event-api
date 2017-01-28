const express = require('express')
const path = require('path')
const http = require('http')
const bodyParser = require('body-parser')
const passport = require('passport')

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
app.use(passport.initialize())
app.use(passport.session())

// Test route
app.get('/', function (req, res) {
  res.render('index')
})

// Define API routes
// ...

// Catch any 403 errors and render the 403 page.
app.use(function (err, req, res, next) {
  if (err.status === 403) {
    res.render('403')
  } else {
    next()
  }
})

// Catch any 404 errors and render the 404 page.
// Note: This must be below all other routes because
// of the way that Express handles routing.
app.use(function (req, res, next) {
  res.status(404).render('404')
})

// Start the Express server
http.createServer(app)
  .listen(app.get('port'), function () {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'))
  })
