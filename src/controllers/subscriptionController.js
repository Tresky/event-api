let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

let ApiError = require('../lib/apiErrors')

class SubscriptionController extends ApiController {
  index (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = helpers.requireParams([
      'userId',
      'rsoId'
    ], req.body, true)

    if (!params.userId && !params.rsoId) {
      return res.json([])
    }

    let payload = _.merge({
      inactiveAt: null
    }, params)
    db.Subscription.findAll({
      where: payload
    }).then((subs) => {
      res.json(subs)
    })
  }

  create (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required and optional parameters
    let params = helpers.requireParams([
      'rsoId'
    ], req.body)

    db.Subscription.count({
      where: {
        rsoId: params.rsoId,
        userId: req.user.id
      }
    }).then((count) => {
      if (count > 0) {
        return next(new ApiError.UserAlreadySubscribedToRso(params))
      } else {
        execute()
      }
    })

    let execute = () => {
      db.Subscription.create({
        userId: req.user.id,
        rsoId: params.rsoId
      }).then((sub) => {
        res.json(sub)
      }, (response) => {
        console.log('Failed to create new subscription record', response)
      })
    }
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

    db.Subscription.findById(params.id)
      .then((sub) => {
        if (req.user.id !== sub.userId) {
          return next(new ApiError.InvalidPermissionForAction({ action: 'subscription.destroy', userId: req.user.id, id: params.id }))
        } else {
          sub.inactiveAt = moment().utc()
          sub.save()
          .then((instance) => {
            res.json(instance)
          })
        }
      })
  }
}

module.exports = new SubscriptionController()
