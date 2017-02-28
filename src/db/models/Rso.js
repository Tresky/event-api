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

  return Rso
}
