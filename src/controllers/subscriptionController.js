let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

let ApiError = require('../lib/apiErrors')

class SubscriptionController extends ApiController {
  /**
   * @api {get} /api/subscription Select Subscriptions
   * @apiName getAllSubscription
   * @apiGroup Subscription
   * @apiDescription Can query for subscriptions based on userId and/or rsoId.
   *
   * @apiParam (Body Params) {Integer} userId Id of the user to query subs for
   * @apiParam (Body Params) {Integer} rsoId Id of the rso to query subs for
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   [{
   *    id: 2,
   *    userId: 1,
   *    ...
   *   }, {
   *    id: 5,
   *    userId: 2,
   *    ...
   *   }]
   */
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

  /**
   * @api {post} /api/subscription Create Subscription
   * @apiName createSubscription
   * @apiGroup Subscription
   * @apiDescription Creates a new Subscription record to subscribe a user to an RSO.
   *                 The user being subscribed will be the current logged-in user.
   *
   * @apiParam (Body Params) {Integer} rsoID Id of the RSO to subscribe to
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    userId: 3,
   *    ...
   *   }
   */
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

  /**
   * @api {delete} /api/subscription/:id Destroy Subscription
   * @apiName destroySubscription
   * @apiGroup Subscription
   * @apiDescription Mark a Subscription as inactive
   *
   * @apiParam (URL Params) {Integer} id Id of the Subscription to destroy
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    userId: 6,
   *    ...
   *    inactiveAt: 2017-05-06
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
