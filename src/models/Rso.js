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

  let hooks = {}

  var Rso = db.define('Rso', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    created_by_id: {
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
    }
  }, {
    tableName: 'Rso',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  // Rso.belongsToMany(db.models.User, { through: 'Membership' })
  Rso.sync()

  return Rso
}
