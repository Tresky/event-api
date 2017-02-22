let _ = require('lodash')

let ApiErrors = require('./apiErrors')
let db = require('../db')

let permLevels = {
  SUPERADMIN: 1,
  ADMIN: 2,
  STUDENT: 3
}

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
    this.superAdmin = null

    db.Membership.findAll({
      where: {
        userId: this.user.id
      }
    }).then((membs) => {
      this.memberships = membs

      _.each(this.memberships, (memb) => {
        if (_.isNull(memb.rsoId)) {
          this.superAdmin = memb.universityId
        } else {
          this.permissionsByRso[memb.rsoId] = concatPerms(memb.permissionLevel)
        }
      })
    })
  }

  userCan (permission) {
    if (!permission) {
      return new ApiErrors.RequiredParametersMissing()
    }

    return _.has(this.permission)
  }

  userCanInRso (permission, rsoId) {
    if (!permission || !rsoId) {
      return new ApiErrors.RequiredParametersMissing()
    }

    return _.has(this.permissionsByRso, rsoId) &&
           _.includes(this.permissionsByRso[rsoId], permission)
  }
}
