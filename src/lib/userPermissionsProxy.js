let _ = require('lodash')

let ApiErrors = require('./apiErrors.js')
let db = require('../db')

import permLevels from './permissionLevels'

let permissions = {
  SUPERADMIN: [
    'rso.create'
  ],
  ADMIN: [
    'events.create',

    'rso.edit'
  ],
  STUDENT: [
    'events.view',

    'rso.subscribe'
  ]
}

/**
 * Conacatenate the permissions that the user should have
 * based on an arbitrary permissions level.
 * @param  {integer} level Level to concatenate permissions for
 * @return {array}         Array of permissions that are allowed
 */
let concatPerms = (level) => {
  return _.concat([],
    (level <= permLevels.STUDENT) ? permissions.STUDENT : [],
    (level === permLevels.ADMIN) ? permissions.ADMIN : [],
    (level === permLevels.SUPERADMIN) ? permissions.SUPERADMIN : []
  )
}

export default class UserPermissionsProxy {
  constructor (user) {
    console.log('Instantiating UserPermissionsProxy', user.id)

    this.user = user
    this.memberships = []
    this.permissionsByRso = {}
    this.permissionsByUniversity = {}
    this.superAdmin = null

    // Find all memberships that a user has within various RSO's.
    // If a user has a super
    db.Membership.findAll({
      where: {
        userId: this.user.id
      }
    }).then((membs) => {
      this.memberships = membs

      _.each(this.memberships, (memb) => {
        if (_.isNull(memb.rsoId)) {
          this.permissionsByUniversity[memb.universityId] = concatPerms(memb.permissionLevel)
        } else {
          this.permissionsByRso[memb.rsoId] = concatPerms(memb.permissionLevel)
        }
      })
      console.log('UserPermissionsProxy Instantiated', this.permissionsByRso, this.permissionsByUniversity)
    })
  }

  /**
   * Returns a boolean representing is a user has
   * or does not have a specified permission within an RSO.
   * @param {string}  permission Permission string to check for
   * @param {integer} rsoId      ID of the RSO to check within
   * @return {boolean}           True if has permission, false otherwise
   */
  userCanInRso (permission, rsoId) {
    if (!permission || !rsoId) {
      return new ApiErrors.RequiredParametersMissing()
    }

    return _.has(this.permissionsByRso, rsoId) &&
           _.includes(this.permissionsByRso[rsoId], permission)
  }
}
