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

/**
 * Checks a specified permission set for a permission to
 * be allowed at a specified index. An index represents
 * the user's permissions within a university or RSO.
 * @param  {string}  permission    String permission to check for
 * @param  {array}   permissionSet Permission set to check within
 * @param  {integer} id            ID of the RSO or university to check within
 * @return {boolean}               True if user has permission, false otherwise
 */
let checkPermissionSet = (permission, permissionSet, id) => {
  return _.has(permissionSet, id) &&
         _.includes(permissionSet[id], permission)
}

export default class UserPermissionsProxy {
  constructor () {
    // console.log('Instantiating UserPermissionsProxy')

    // this.user = user
    this.memberships = []
    this.permissionsByRso = {}
    this.permissionsByUniversity = {}
    this.superAdmin = null
  }

  /**
   * Initialize the UserPermissionsProxy for the specified user.
   * This will load all Memberships associated with this user and
   * concatenate all valid permissions they have.
   *
   * NOTE: This functionality used to be in the constructor, but
   * I broke it into an #init function so a promise structure
   * could be utilized.
   *
   * @param  {object}  user User object to load permissions for
   * @return {Promise} A promise that resolves when all permissions are loaded
   */
  init (user) {
    this.user = user

    // Find all memberships that a user has within various RSO's.
    // If a user has a super
    return db.Membership.findAll({
      where: {
        userId: this.user.id,
        inactiveAt: null
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
      // console.log('UserPermissionsProxy Instantiated', this.permissionsByRso, this.permissionsByUniversity)
    })
  }

  /**
   * Generic function that will check to see if a user can
   * perform an action within an entity (rso or university).
   * @param  {string}  permission Permission string to check for
   * @param  {string}  type       Type of permission check for (rso or university)
   * @param  {integer} id         ID of the entity to check within
   * @return {boolean}            True if has permission, false otherwise
   */
  userCan (permission, type, id) {
    if (type === 'rso') {
      return this.userCanInRso(permission, id)
    } else if (type === 'university') {
      return this.userCanInUniversity(permission, id)
    } else {
      return false
    }
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
      return false
    }

    return checkPermissionSet(permission, this.permissionsByRso, rsoId)
  }

  /**
   * Returns a boolean representing is a user has
   * or does not have a specified permission within a university.
   * @param {string}  permission Permission string to check for
   * @param {integer} uniId      ID of the university to check within
   * @return {boolean}           True if has permission, false otherwise
   */
  userCanInUniversity (permission, uniId) {
    if (!permission || !uniId) {
      return new ApiErrors.RequiredParametersMissing()
    }

    return checkPermissionSet(permission, this.permissionsByUniversity, uniId)
  }
}
