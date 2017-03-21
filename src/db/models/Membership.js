let _ = require('lodash')

let ApiErrors = require('../../lib/apiErrors')
import permLevels from '../../lib/permissionLevels'

module.exports = (db, DataTypes) => {
  let classMethods = {}

  let instanceMethods = {}

  /**
   * Runs everytime a membership is saved. If the membership
   * defines a relationship to a university (not an RSO), the
   * permissionLevel cannot be ADMIN. If the membership defines
   * a relationship to an RSO, the permissionLevel cannot be
   * SUPERADMIN. These don't make sense.
   */
  let beforeSave = (memb, options, fn) => {
    // Cannot be an ADMIN in a university
    if (_.isNull(memb.rsoId) && memb.permissionLevel === permLevels.ADMIN) {
      fn(new ApiErrors.InvalidUniversityPermissionLevel(), null)
      return
    // Cannot be a SUPERADMIN in an RSO
    } else if (memb.rsoId && memb.permissionLevel === permLevels.SUPERADMIN) {
      fn(new ApiErrors.InvalidRsoPermissionLevel(), null)
      return
    }

    // Make sure the membership is set to active -> true
    if (!memb.inactiveAt) {
      memb.inactiveAt = null
      memb.inactiveBy = null
    }

    // Cannot have two records within the same
    if (_.isNull(memb.rsoId)) {
      universityMembershipExists(memb.userId)
        .then((exists) => {
          if (exists) {
            fn(new ApiErrors.AlreadyHaveActiveUniversityMembership(), null)
          } else {
            fn(null, memb)
          }
        })
    } else {
      fn(null, memb)
    }
  }

  let hooks = {
    beforeUpdate: beforeSave,
    beforeCreate: beforeSave
  }

  var Membership = db.define('Membership', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rsoId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    universityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    permissionLevel: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inactiveAt: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    inactiveById: DataTypes.INTEGER
  }, {
    tableName: 'Membership',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  /*******************
   * LOCAL FUNCTIONS *
   *******************/

  /**
   * Check to see is a membership for a given user in a
   * university already exists or not.
   * @param  {String} userId User Id to check for with a university record
   * @return {Boolean}       True if userId exists; false otherwise
   */
  let universityMembershipExists = (userId) => {
    return Membership.count({ where: { userId: userId, rsoId: null, inactiveAt: null } })
      .then((count) => {
        return (count > 0)
      })
  }

  return Membership
}
