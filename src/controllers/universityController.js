let _ = require('lodash')
let moment = require('moment')

let db = require('../db.js')
let helpers = require('../lib/controllerHelpers')
let ApiError = require('../lib/apiErrors')

let ApiController = require('./apiController')

class UniversityController extends ApiController {
  /**
   * @api {put} /api/university Select Universities
   * @apiName getAllUni
   * @apiGroup University
   * @apiDescription Select all Universities matching a query; if no optional parameters
   *                 are specified, a list of all Universities will be returned.
   *
   * @apiParam (Body Params) {String}  [name] Name of the University to select
   * @apiParam (Body Params) {Integer} [userId] Id of the user you want to get universities for
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   [{
   *    id: 1,
   *    name: 'University of Central Florida',
   *    ...
   *   }, {
   *    id: 2,
   *    name: 'University of South Texas',
   *    ...
   *   }]
   */
  index (req, res, next) {
    // Get the required parameters
    let params = helpers.requireParams([
      'name',
      'userId'
    ], req.body, true)

    let execute = (explicitIds) => {
      let promises = []

      if (params.name) {
        let payload = { name: params.name }
        promises.push(db.University.findAll({ where: payload }))
      }
      if (explicitIds && explicitIds.length > 0) {
        promises.push(db.University.findAll({ where: explicitIds }))
      }
      if (!explicitIds && !params.name) {
        promises.push(db.University.findAll())
      }

      Promise.all(promises)
      .then((results) => {
        res.json(_.unionBy(results[0], results[1], 'id'))
      })
    }

    if (params.userId) {
      db.Membership.findAll({ where: { userId: params.userId, rsoId: null } })
        .then((membs) => {
          execute(_.map(membs, 'universityId'))
        })
    } else {
      execute()
    }
  }

  /**
   * @api {get} /api/university/:id Select Single University
   * @apiName getUni
   * @apiGroup University
   * @apiDescription Returns a single University record with the specified ID
   *
   * @apiParam (URL Params) {Integer} id Id of the University record to fetch
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 2,
   *    name: 'University of Central Florida',
   *    ...
   *   }
   */
  show (req, res, next) {
    // Get the required parameters
    let params = helpers.requireParams([
      'id'
    ], req.params)

    db.University.findById(params.id)
      .then((uni) => {
        if (!uni) {
          return next(new ApiError.UniversityRecordNotFound())
        }
        res.json(uni)
      })
  }

  /**
   * @api {put} /api/university/:id Update a University
   * @apiName updateUni
   * @apiGroup University
   * @apiDescription Update an existing University record with the specified ID
   *
   * @apiParam (URL Params) {Integer} id Id of the University record to fetch
   * @apiParam (Body Params) {String} [description] New description of the University
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 2,
   *    name: 'University of Central Florida',
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
        'description'
      ], req.body, true),
      helpers.requireParams([
        'id'
      ], req.params)
    )

    // Make sure the authenticated user has permission
    // to update a university's data
    if (!req.permissions.userCan('university.update', 'university', params.id)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'university.update', params: params }))
    }

    db.University.findOne({
      where: {
        id: params.id
      }
    }).then((uni) => {
      // Update all attributes that are being changed
      _.each(params, (value, key) => {
        uni[key] = value
      })
      uni.save()
        .then((instance) => {
          uni.json(instance)
        })
    })
  }

  /**
   * @api {delete} /api/university/:universityId Destroy University
   * @apiName destroyUni
   * @apiGroup University
   * @apiDescription Mark a University as inactive
   *
   * @apiParam (URL Params) {Integer} id Id of the University to select within
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    name: 'Tech Knights',
   *    ...
   *    inactiveAt: '2017-04-05'
   *   }
   */
  destroy (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    let params = helpers.requireParams([
      'id'
    ], req.body)

    // Make sure the authenticated user has permission
    // to destroy a university
    if (!req.permissions.userCan('university.destroy', 'university', params.id)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'university.destroy', params: params }))
    }

    db.University.findById(params.id)
      .then((uni) => {
        if (!uni) {
          return next(new ApiError.UniversityRecordNotFound(params))
        }

        uni.setDataValue('inactiveAt', moment().utc())
        uni.setDataValue('inactiveById', req.user.id)
        uni.save()
          .then(() => {
            res.json(uni)
          })
      })
  }
}

module.exports = new UniversityController()
