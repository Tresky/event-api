let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

let ApiError = require('../lib/apiErrors')

class CommentController extends ApiController {
  index (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = helpers.requireParams([
      'eventId'
    ], req.params)

    let payload = _.merge({
      inactiveAt: null
    }, params)
    db.Comment.findAll({
      where: payload
    }).then((comments) => {
      res.json(comments)
    })
  }

  show (req, res, next) {
    // Make sure that the user is logged in
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = helpers.requireParams([
      'eventId',
      'id'
    ], req.params)

    db.Comment.findById(params.id)
      .then((comment) => {
        if (!comment) {
          return next(new ApiError.NoCommentRecordExists({ action: 'comment#show', params: params }))
        } else {
          res.json(comment)
        }
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
        'message'
      ], req.body),
      helpers.requireParams([
        'eventId'
      ], req.params)
    )

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('comment.create', 'rso', params.rsoId)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'comment.create', userId: req.user.id }))
    }

    // Who is creating this event?
    params.createdById = req.user.id

    let payload = params
    db.Comment.create(payload)
      .then((comment) => {
        res.json(comment)
      }, (response) => {
        console.log('Failed to create comment record', response)
      })
  }

  update (req, res, next) {
    // Make sure that the user is logged in
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'eventId',
        'id'
      ], req.params),
      helpers.requireParams([
        'message'
      ], req.body)
    )

    db.Comment.findById(params.id)
      .then((comment) => {
        if (req.user.id !== comment.createdById) {
          return next(new ApiError.InvalidPermissionForAction({ action: 'comment.update', params: params }))
        } else {
          // Update all attributes being changed
          _.each(params, (value, key) => {
            if (key !== 'id' && key !== 'eventId') {
              comment[key] = value
            }
          })
          comment.save()
            .then((instance) => {
              res.json(instance)
            })
        }
      })
  }

  destroy (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required and optional parameters
    let params = helpers.requireParams([
      'eventId',
      'id'
    ], req.params)

    db.Comment.find({
      where: { id: params.id }
    }).then((comment) => {
      if (req.user.id !== comment.createdById) {
        return next(new ApiError.InvalidPermissionForAction({ action: 'comment.destroy', userId: req.user.id, id: params.id }))
      } else {
        comment.inactiveAt = moment().utc()
        comment.save()
          .then((instance) => {
            res.json(instance)
          })
      }
    })
  }
}

module.exports = new CommentController()
