let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

let ApiError = require('../lib/apiErrors')

class CommentController extends ApiController {
  /**
   * @api {get} /api/university/:universityId/event/:eventId/comment Select Comments on Event
   * @apiName getAllComments
   * @apiGroup Comment
   * @apiDescription Can request comments that are attached to an event. There
   *                 are no body parameters for this function; only URL parameters.
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to get select within
   * @apiParam (URL Params) {Integer} eventId Id of the event to get comments for
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   [{
   *    id: 2,
   *    message: 'Good event idea!',
   *    ...
   *   }, {
   *    id: 5,
   *    message: 'Can\' wait to attend this event!',
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
      'eventId'
    ], req.params)

    let payload = _.merge({
      inactiveAt: null
    }, params)
    db.Comment.findAll({
      where: payload
    }).then((comments) => {
      let userIds = _.map(comments, 'createdById')
      db.User.findAll({
        where: {
          id: userIds
        }
      }).then((users) => {
        let result = _.map(comments, (comm) => {
          comm.user = _.find(users, { id: comm.createdById })
          return comm
        })
        res.json(result)
      })
    })
  }

  /**
   * @api {get} /api/university/:universityId/event/:eventId/comment/:id Select Single Comment
   * @apiName getComment
   * @apiGroup Comment
   * @apiDescription Returns a single Comment record with the specified ID
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select from
   * @apiParam (URL Params) {Integer} eventId Id of the event to select from
   * @apiParam (URL Params) {Integer} id Id of the Comment record to fetch
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 2,
   *    message: 'Cool event idea!',
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

  /**
   * @api {post} /api/university/:universityId/event/:eventId/comment Create Comment
   * @apiName createComment
   * @apiGroup Comment
   * @apiDescription Creates a new Comment record with the given data
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to post in
   * @apiParam (URL Params) {Integer} eventId Id of the Event to post to
   * @apiParam (Body Params) {String} message Text of the message of the comment
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    message: 'New comment',
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
        'message'
      ], req.body),
      helpers.requireParams([
        'eventId',
        'universityId'
      ], req.params)
    )

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('comment.create', 'university', params.universityId)) {
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

  /**
   * @api {put} /api/university/:universityId/event/:eventId/coment/:id Update Comment
   * @apiName updateComment
   * @apiGroup Comment
   * @apiDescription Update an existing Comment record with the given data
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select within
   * @apiParam (URL Params) {Integer} eventId Id of the Comment to select within
   * @apiParam (URL Params) {Integer} id Id of the Comment to update
   * @apiParam (Body Params) {String} [message] Message text to update
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    message: 'Updated comment',
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

  /**
   * @api {delete} /api/university/:universityId/event/:eventId/comment/:id Destroy Comment
   * @apiName destroyComment
   * @apiGroup Comment
   * @apiDescription Mark an Comment as inactive
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select within
   * @apiParam (URL Params) {Integer} eventId Id of the Event to select within
   * @apiParam (URL Params) {Integer} id Id of the Comment to destroy
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    name: 'Dead comment',
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
