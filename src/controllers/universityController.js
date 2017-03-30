let _ = require('lodash')
let moment = require('moment')

let db = require('../db.js')
let helpers = require('../lib/controllerHelpers')
let ApiError = require('../lib/apiErrors')

let ApiController = require('./apiController')

class UniversityController extends ApiController {
  index (req, res, next) {
    // Get the required parameters
    let params = helpers.requireParams([
      'name'
    ], req.body, true)

    let payload = params
    db.University.findAll({
      where: payload
    }).then((unis) => {
      res.json(unis)
    })
  }

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

  // The destroy functionality doesn't actually destroy
  // the record being targeted in the traditional sense.
  // Instead, a deleted_at timestamp is set to signal to
  // us that this record should no longer be used. This
  // allows us to keep a full history of records and we
  // never lose data.
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
