let _ = require('lodash')

let db = require('../db')
let ApiError = require('../lib/apiErrors')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

class UserController extends ApiController {
  /**
   * @api {get} /api/users/:id Select Single User
   * @apiName getUser
   * @apiGroup Users
   * @apiDescription Returns a single User record with the specified ID
   *
   * @apiParam (URL Params) {Integer} id Id of the User record to fetch
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 2,
   *    firstName: 'Tyler',
   *    lastName: 'Petresky',
   *    ...
   *   }
   */
  show (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    let params = helpers.requireParams([
      'id'
    ], req.params)

    let payload = params
    db.User.findOne({
      where: payload
    }).then((user) => {
      if (!user) {
        return next(new ApiError.UserRecordNotFound())
      }
      res.json(user)
    })
  }

  /**
   * @api {put} /api/users/:id Update a User
   * @apiName updateUser
   * @apiGroup Users
   * @apiDescription Update an existing User record with the specified ID
   *
   * @apiParam (URL Params) {Integer} id Id of the User record to fetch
   * @apiParam (Body Params) {String} [firstName] New first name of the User
   * @apiParam (Body Params) {String} [lastName] New last name of the User
   * @apiParam (Body Params) {String} [email] New email of the User
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 2,
   *    firstName: 'Tyler',
   *    lastName: 'Petresky',
   *    ...
   *   }
   */
  update (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'firstName',
        'lastName',
        'email'
      ], req.body, true),
      helpers.requireParams([
        'id'
      ], req.params)
    )

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (req.user.id !== parseInt(params.id)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'user.update', params: params }))
    }

    db.User.findOne({
      where: {
        id: params.id
      }
    }).then((user) => {
      // Update all attributes that are being changed
      _.each(params, (value, key) => {
        if (key !== 'id') {
          user[key] = value
        }
      })
      user.save()
        .then((instance) => {
          res.json(instance)
        })
    })
  }

  permissions (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    res.json(req.permissions)
  }
}

module.exports = new UserController()
