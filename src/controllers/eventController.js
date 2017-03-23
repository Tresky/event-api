// let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
// let config = require('../../config/secrets')
let ApiError = require('../lib/apiErrors')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

// import permLevels from '../lib/permissionLevels'

class EventController extends ApiController {
  index (req, res, next) {

  }

  show (req, res) {

  }

  create (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required and optional parameters
    let params = _.merge(
      helpers.requireParams([
        'name',
        'description',
        'startTime',
        'endTime',
        'privacy',
        'category',
        'rsoId',
        'universityId'
      ], req.body),
      helpers.requireParams([
        'contactPhone',
        'contactEmail'
      ], req.body, true)
    )

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('events.create', 'rso', params.rsoId)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'events.create', userId: req.user.id }))
    }

    // Who is creating this event?
    params.createdById = req.user.id

    let payload = params
    db.Event.create(payload)
      .then((evt) => {
        res.json(evt)
      }, (response) => {
        console.log('Failed to create event record', response)
      })
  }

  update (req, res) {

  }

  destroy (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required and optional parameters
    let params = helpers.requireParams([
      'id'
    ], req.body)

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('events.destroy', 'rso', params.rsoId)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'events.destroy', userId: req.user.id }))
    }

    db.Event.find({
      where: { id: params.id }
    }).then((evt) => {
      evt.active = false
      evt.save()
      res.json(evt)
    })
  }
}

module.exports = new EventController()
