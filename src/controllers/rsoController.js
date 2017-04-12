let moment = require('moment')
let _ = require('lodash')

let db = require('../db')
let ApiError = require('../lib/apiErrors')
let helpers = require('../lib/controllerHelpers')

let ApiController = require('./apiController')

import permLevels from '../lib/permissionLevels'

class RsoController extends ApiController {
  /**
   * @api {get} /api/university/:universityId/rso Select RSOs
   * @apiName getAllRsos
   * @apiGroup RSO
   * @apiDescription If no optional parameters are specified, all RSOs within the university
   *                 specified will be retrieved. Also, this function will only ever return
   *                 RSOs that are currently 'active' (rso.inactiveAt === null).
   *
   * @apiParam (URL Params) {Integer} universityId Id of the university to select within
   * @apiParam (Body Params) {String} [name] Name of the university to fetch
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   [{
   *    id: 2,
   *    name: 'Tech Knights',
   *    ...
   *   }, {
   *    id: 5,
   *    name: 'Sowing Club',
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

  /**
   * @api {get} /api/university/:universityId/rso/:id Select Single RSO
   * @apiName getRso
   * @apiGroup RSO
   * @apiDescription Returns a single RSO record with the specified ID
   *
   * @apiParam (URL Params) {Integer} universityId Id of the university to select within
   * @apiParam (URL Params) {Integer} id Id of the RSO record to fetch
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 2,
   *    name: 'Rowing Clud',
   *    ...
   *   }
   */
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

  /**
   * @api {post} /api/university/:universityId/rso Create RSO
   * @apiName createRso
   * @apiGroup RSO
   * @apiDescription Creates a new RSO record with the given data
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select within
   * @apiParam (Body Params) {String} name Name of the new Rso
   * @apiParam (Body Params) {String} description Description of the new Rso
   * @apiParam (Body Params) {Array} memberEmails Array of four emails for the other members signing up
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    name: 'Tech Knights',
   *    ...
   *   }
   */
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

    // Ensure all emails are unique and remove the email
    // of the current logged in user if it is present. This
    // will prevent them from using their own email to represent
    // two users... sneaky bastards.
    _.pull(params.memberEmails = _.uniq(params.memberEmails), req.user.email)

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
      db.User.findOne({ where: { email: params.memberEmails[0], inactiveAt: null } }),
      db.User.findOne({ where: { email: params.memberEmails[1], inactiveAt: null } }),
      db.User.findOne({ where: { email: params.memberEmails[2], inactiveAt: null } }),
      db.User.findOne({ where: { email: params.memberEmails[3], inactiveAt: null } })
    )

    let usersToAdd = []
    Promise.all(userChecks)
      .then((results) => {
        if (_.every(results, res => res)) {
          usersToAdd = results

          let checkingForUniMemb = _.concat([],
            usersToAdd[0].isMemberOfUniversity(params.universityId),
            usersToAdd[1].isMemberOfUniversity(params.universityId),
            usersToAdd[2].isMemberOfUniversity(params.universityId),
            usersToAdd[3].isMemberOfUniversity(params.universityId)
          )

          Promise.all(checkingForUniMemb)
            .then((isMemb) => {
              if (_.every(isMemb, r => r)) {
                executeCreation(params)
              } else {
                const returnRes = _.zipObject(params.memberEmails, _.map(results, r => !!r))
                return next(new ApiError.InvalidUserSpecifiedForCreation(returnRes))
              }
            })
        } else {
          const returnRes = _.zipObject(params.memberEmails, _.map(results, r => !!r))
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
          let membershipPromises = _.concat([],
            req.user.addRso(rso, {
              permissionLevel: permLevels.ADMIN,
              universityId: params.universityId
            }),
            usersToAdd[0].addRso(rso, {
              permissionLevel: permLevels.STUDENT,
              universityId: params.universityId
            }),
            usersToAdd[1].addRso(rso, {
              permissionLevel: permLevels.STUDENT,
              universityId: params.universityId
            }),
            usersToAdd[2].addRso(rso, {
              permissionLevel: permLevels.STUDENT,
              universityId: params.universityId
            }),
            usersToAdd[3].addRso(rso, {
              permissionLevel: permLevels.STUDENT,
              universityId: params.universityId
            })
          )

          Promise.all(membershipPromises)
            .then(() => {
              res.json(rso)
            })
        }, (response) => {
          console.log('Failed to create new RSO in university', response)
          return next(new ApiError.NoRsoInUniversity({ action: 'rso#create', params: params, response: response }))
        })
    }
  }

  /**
   * @api {put} /api/university/:universityId/rso/:id Update RSO
   * @apiName updateRso
   * @apiGroup RSO
   * @apiDescription Update an existing RSO record with the given data
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select within
   * @apiParam (URL Params) {Integer} id Id of the Rso to update
   * @apiParam (Body Params) {String} [name] Name of the new Rso
   * @apiParam (Body Params) {String} [description] Description of the new Rso
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *   {
   *    id: 4,
   *    name: 'Tech Knights',
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

  /**
   * @api {delete} /api/university/:universityId/rso/:id Destroy RSO
   * @apiName destroyRso
   * @apiGroup RSO
   * @apiDescription Mark an RSO as inactive
   *
   * @apiParam (URL Params) {Integer} universityId Id of the University to select within
   * @apiParam (URL Params) {Integer} id Id of the Rso to destroy
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
