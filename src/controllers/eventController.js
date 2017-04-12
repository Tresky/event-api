let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

let ApiError = require('../lib/apiErrors')

import eventPrivacyLevels from '../lib/eventPrivacyLevels'

let getAllowedPrivacy = (universityId, userId, rsoId) => {
  return new Promise((resolve, reject) => {
    let membershipCount = []
    membershipCount.push(
      db.Membership.count({
        where: {
          universityId: parseInt(universityId),
          userId: userId,
          rsoId: null
        }
      })
    )
    if (rsoId) {
      membershipCount.push(
        db.Membership.count({
          where: {
            universityId: parseInt(universityId),
            userId: userId,
            rsoId: rsoId
          }
        })
      )
    }

    let allowedPrivacy = eventPrivacyLevels.PUBLIC // public
    Promise.all(membershipCount)
      .then((result) => {
        if (result[0] > 0) {
          allowedPrivacy = eventPrivacyLevels.PRIVATE
        }
        if (result[1] > 0) {
          allowedPrivacy = eventPrivacyLevels.RSO
        }
        resolve(allowedPrivacy)
      })
      .catch((res) => {
        console.log('Failed to determine privacy level', res)
      })
  })
}

class EventController extends ApiController {
  /**
   * @api {get} /api/university/:universityId/event Select All Events
   * @apiName getAllEvents
   * @apiGroup Event
   * @apiDescription Can request all events based on parameters specified.
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to get select within
   * @apiParam (Body Params) {String} [name] Name of the event
   * @apiParam (Body Params) {Integer} [privacy] Privacy level of the event: RSO=1 - PRIVATE=2 - PUBLIC=3
   * @apiParam (Body Params) {Integer} [category] Category the event is in
   * @apiParam (Body Params) {Integer} [createdById] Query by who created the event
   * @apiParam (Body Params) {Integer} [rsoId] Query the RSO the event is associated with
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   [{
   *    id: 2,
   *    name: 'Cool Event',
   *    ...
   *   }, {
   *    id: 5,
   *    name: 'Cooler Event',
   *    ...
   *   }]
   */
  index (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'name',
        'privacy',
        'category',
        'createdById',
        'rsoId'
      ], req.body, true),
      helpers.requireParams([
        'universityId'
      ], req.params)
    )

    let allowedPrivacy = eventPrivacyLevels.PUBLIC
    getAllowedPrivacy(params.universityId, req.user.id, params.rsoId || undefined)
      .then((privacy) => {
        allowedPrivacy = privacy
        let payload = _.merge({
          inactiveAt: null
        }, params)
        db.Event.findAll({
          where: payload
        }).then((events) => {
          res.json(_.filter(events, (evt) => {
            return evt.privacy >= allowedPrivacy
          }))
        })
      })
  }

  /**
   * @api {get} /api/university/:universityId/event/:id Select Single Event
   * @apiName getEvent
   * @apiGroup Event
   * @apiDescription Returns a single Event record with the specified ID
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select from
   * @apiParam (URL Params) {Integer} id Id of the Event record to fetch
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 2,
   *    name: 'Cool Event',
   *    ...
   *   }
   */
  show (req, res, next) {
    // Make sure that the user is logged in
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = helpers.requireParams([
      'universityId',
      'id'
    ], req.params)

    getAllowedPrivacy(params.universityId, req.user.id)
      .then((privacy) => {
        db.Event.findById(params.id)
          .then((evt) => {
            if (!evt) {
              return next(new ApiError.NoEventinRso({ action: 'event#show', params: params }))
            } else if (evt.privacy < privacy) {
              return next(new ApiError.EventPrivacyRestriction())
            } else {
              res.json(evt)
            }
          })
      })
  }

  /**
   * @api {post} /api/university/:universityId/event/:id Create Event
   * @apiName createEvent
   * @apiGroup Event
   * @apiDescription Creates a new Event record with the given data
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to post in
   * @apiParam (Body Params) {String} {name} Name of the event
   * @apiParam (Body Params) {String} {description} Description of the event
   * @apiParam (Body Params) {Date} {startTime} Time that the event starts
   * @apiParam (Body Params) {Date} {endTime} Time that the event ends
   * @apiParam (Body Params) {Integer} {privacy} Privacy level of the event: RSO=1 - PRIVATE=2 - PUBLIC=3
   * @apiParam (Body Params) {String} [contactPhone] Phone number to call for info
   * @apiParam (Body Params) {String} [contactEmail] Email to message for info
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    name: 'New event',
   *    ...
   *   }
   */
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
        'rsoId'
      ], req.body),
      helpers.requireParams([
        'universityId'
      ], req.params),
      helpers.requireParams([
        'contactPhone',
        'contactEmail'
      ], req.body, true)
    )

    // Make sure user is member of Rso
    db.Membership.count({
      where: { userId: req.user.id, rsoId: params.rsoId, inactiveAt: null }
    }).then((count) => {
      if (!count) {
        next(new ApiError.UserNotInRso())
      } else {
        performCreate()
      }
    })

    let performCreate = () => {
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
  }

  /**
   * @api {put} /api/university/:universityId/event/:id Update Event
   * @apiName updateComment
   * @apiGroup Event
   * @apiDescription Update an existing Event record with the given data
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select within
   * @apiParam (URL Params) {Integer} id Id of the Event to update
   * @apiParam (Body Params) {String} [name] Name of the event
   * @apiParam (Body Params) {String} [description] Description of the event
   * @apiParam (Body Params) {Date} [startTime] Time that the event starts
   * @apiParam (Body Params) {Date} [endTime] Time that the event ends
   * @apiParam (Body Params) {Integer} [privacy] Privacy level of the event: RSO=1 - PRIVATE=2 - PUBLIC=3
   * @apiParam (Body Params) {String} [contactPhone] Phone number to call for info
   * @apiParam (Body Params) {String} [contactEmail] Email to message for info
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    name: 'Face Painting',
   *    ...
   *   }
   */
  update (req, res, next) {
    // Make sure that the user is logged in
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'universityId',
        'id'
      ], req.params),
      helpers.requireParams([
        'name',
        'description',
        'startTime',
        'endTime',
        'privacy',
        'category',
        'contactPhone',
        'contactEmail'
      ], req.body, true)
    )

    if (!req.permissions.userCan('event.update', 'rso', params.rsoId)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'events.update', params: params }))
    }

    db.Event.findOne({
      where: {
        id: params.id,
        rsoId: params.rsoId,
        universityId: params.universityId
      }
    }).then((event) => {
      // Update all attributes being changed
      _.each(params, (value, key) => {
        if (key !== 'universityId' && key !== 'id' && key !== 'rsoId') {
          event[key] = value
        }
      })
      event.save()
        .then((instance) => {
          res.json(instance)
        })
    })
  }

  /**
   * @api {delete} /api/university/:universityId/event/:id Destroy Event
   * @apiName destroyEvent
   * @apiGroup Event
   * @apiDescription Mark an Event as inactive
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to look in
   * @apiParam (URL Params) {Integer} id Id of the Event to destroy
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    name: 'Dead event',
   *    ...
   *    inactiveAt: '2017-04-05'
   *   }
   */
  destroy (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required and optional parameters
    let params = helpers.requireParams([
      'id'
    ], req.params)

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('events.destroy', 'rso', params.rsoId)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'events.destroy', userId: req.user.id }))
    }

    db.Event.find({
      where: { id: params.id }
    }).then((evt) => {
      evt.inactiveAt = moment().utc()
      evt.inactiveById = req.user.id
      evt.save()
        .then((instance) => {
          res.json(instance)
        })
    })
  }
}

module.exports = new EventController()
