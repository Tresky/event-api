module.exports = (db, DataTypes) => {
  let classMethods = {
    associate (models) {
      Rso.belongsToMany(models.User, {
        through: models.Membership,
        foreignKey: 'rsoId'
      })
    }
  }

  let instanceMethods = {}

  /**
   * Runs everytime an RSO is saved. This will be primarily
   * executed from the RsoController#destroy endpoint. whenever
   * an Rso is set to being inactive, all Memberships with it
   * will also be set to inactive.
   */
  let beforeSaveHook = (rso, options, fn) => {
    if (rso.changed('inactiveAt')) {
      // If the inactiveAt field has been set, we
      // need to set all memberships that are associated
      // to inactive.
      db.models.Membership.update({
        inactiveAt: rso.inactiveAt
      }, {
        where: {
          rsoId: rso.id
        }
      }).then(() => {
        fn(null, rso)
      })
      return
    }
    fn(null, rso)
  }

  /**
   * This function will primarily not be used in the API.
   * It exists mostly for the testing environment, but
   * accomplishes a similar purpose to the beforeSaveHook.
   */
  let destroyMemberships = (rso, options, fn) => {
    // If the inactiveAt field has been set, we
    // need to set all memberships that are associated
    // to inactive.
    db.models.Membership.update({
      inactiveAt: new Date()
    }, {
      where: {
        rsoId: rso.id
      }
    }).then(() => {
      fn(null, rso)
    })
  }

  let hooks = {
    beforeUpdate: beforeSaveHook,
    beforeCreate: beforeSaveHook,
    afterDestroy: destroyMemberships
  }

  var Rso = db.define('Rso', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    universityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inactiveAt: {
      type: DataTypes.DATE,
      defaultValue: null
    },
    inactiveById: DataTypes.INTEGER
  }, {
    tableName: 'Rso',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  Rso.sync()

  return Rso
}
