let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
let ApiError = require('../lib/apiErrors')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

import permLevels from '../lib/permissionLevels'

class RsoController extends ApiController {
  index (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'universityId'
      ], req.params),
      helpers.requireParams([
        'name'
      ], req.body, true)
    )

    // Only search for `active` RSOs
    let payload = _.merge({
      inactiveAt: null
    }, params)
    db.Rso.findAll({
      where: payload
    }).then((rsos) => {
      res.json(rsos)
    })
  }

  show (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = helpers.requireParams([
      'universityId',
      'id'
    ], req.params)

    // Locate the desired record in the database
    let payload = params
    db.Rso.findOne({
      where: payload
    }).then((rso) => {
      res.json(rso)
    }, (response) => {
      console.log('Failed to locate RSO in university', response)
      return next(new ApiError.NoRsoInUniversity({ action: 'rso#show', params: params, response: response }))
    })
  }

  create (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'name',
        'description',
        'memberEmails'
      ], req.body),
      helpers.requireParams([
        'universityId'
      ], req.params)
    )

    // TODO: Make sure that the names are unique contrained??

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('rso.create', 'university', params.universityId)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'rso.create', userId: req.user.id }))
    }

    // Check to make sure that there are enough emails being
    // sent to have five people in the RSO.
    // Note: We only check for having at least 4 because the
    // fifth user is assumed to be the user who is signed in.
    if (params.memberEmails.length < 4) {
      return next(new ApiError.NotEnoughMembersInRso(params))
    }

    // Because of the above check, this is guaranteed to have
    // at least four emails in it.
    let userChecks = _.concat([],
      db.User.userExists(params.memberEmails[0]),
      db.User.userExists(params.memberEmails[1]),
      db.User.userExists(params.memberEmails[2]),
      db.User.userExists(params.memberEmails[3])
    )

    Promise.all(userChecks)
      .then((results) => {
        if (_.every(results, res => res)) {
          executeCreation(params)
        } else {
          const returnRes = _.zipObject(params.memberEmails, results)
          return next(new ApiError.InvalidUserSpecifiedForCreation(returnRes))
        }
      })

    let executeCreation = (params) => {
      let payload = _.merge(params, {
        createdById: req.user.id
      })

      db.Rso.create(payload)
        .then((rso) => {
          // Create a membership for the current user
          // as an admin in the new RSO
          req.user.addRso(rso, {
            permissionLevel: permLevels.ADMIN,
            universityId: params.universityId
          }).then((instance) => {
            res.json(rso)
          })
        }, (response) => {
          console.log('Failed to create new RSO in university', response)
          return next(new ApiError.NoRsoInUniversity({ action: 'rso#create', params: params, response: response }))
        })
    }
  }

  update (req, res, next) {
    // Make sure that the user is logged in.
    if (!req.isAuthenticated()) {
      return next(new ApiError.UserNotAuthenticated())
    }

    // Get the required parameters
    let params = _.merge(
      helpers.requireParams([
        'name',
        'description'
      ], req.body, true),
      helpers.requireParams([
        'universityId',
        'id'
      ], req.params)
    )

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('rso.update', 'rso', params.id)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'rso.update', params: params }))
    }

    db.Rso.findOne({
      where: {
        id: params.id,
        universityId: params.universityId
      }
    }).then((rso) => {
      // Update all attributes that are being changed
      _.each(params, (value, key) => {
        if (key !== 'universityId' && key !== 'id') {
          rso[key] = value
        }
      })
      rso.save()
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

    // Get the required parameters
    let params = helpers.requireParams([
      'universityId',
      'id'
    ], req.params)

    // Make sure the authenticated user has permission
    // to create an event in this RSO.
    if (!req.permissions.userCan('rso.destroy', 'rso', params.id)) {
      return next(new ApiError.InvalidPermissionForAction({ action: 'rso.destroy', userId: req.user.id }))
    }

    // Locate the desired RSO in the university and
    // mark it as inactive.
    db.Rso.findOne({
      where: params
    }).then((rso) => {
      // Need to also deal with memberships to this RSO.
      // Not sure what exactly to do with them, yet.
      rso.inactiveAt = moment().utc()
      rso.inactiveById = req.user.id
      rso.save()
        .then((instance) => {
          res.json(instance)
        })
    }, (response) => {
      console.log('Failed to mark RSO as inactive', response)
      return next(new ApiError.NoRsoInUniversity({ action: 'rso#destroy', params: params, response: response }))
    })
  }
}

module.exports = new RsoController()
