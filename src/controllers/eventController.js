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
  index (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'name',
        'description',
        'startTime',
        'endTime',
        'privacy',
        'category',
        'contactPhone',
        'contactEmail',
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
        let payload = params
        db.Event.findAll({
          where: payload
        }).then((events) => {
          res.json(_.filter(events, (evt) => {
            return evt.privacy >= allowedPrivacy
          }))
        })
      })
  }

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
