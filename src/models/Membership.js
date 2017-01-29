console.log('Defining Member')
module.exports = (db, DataTypes) => {
  let classMethods = {}

  let instanceMethods = {}

  let hooks = {}

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
    }
  }, {
    tableName: 'Membership',
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    hooks: hooks
  })

  Membership.sync()

  return Membership
}
